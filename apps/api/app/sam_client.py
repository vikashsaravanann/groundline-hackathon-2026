"""Hosted Meta SAM 3.1 adapter and validated image-grounding normalization.

The wire grammar and mask decoder are provided by the pinned official
``meta-sam-parser`` package. This module never guesses geometry or masks.
"""
from __future__ import annotations

import base64
import hashlib
import json
import math
import os
import time
from dataclasses import dataclass
from io import BytesIO
from typing import Any, AsyncIterator

import httpx
from meta_sam_parser import (
    SegmentationBoxRecord,
    SegmentationMaskRecord,
    decode_mask_to_svg_path,
    image_segmentation_format,
    parse_responses_stream,
)
from PIL import Image, ImageOps, UnidentifiedImageError

MODEL_ID = "sam-3.1"
BASE_URL = "https://api.meta.ai/v1"
PATH = "/responses"
API_KEY_ENV = "MODEL_API_KEY"
MAX_IMAGE_BYTES = 4 * 1024 * 1024
MAX_IMAGE_PIXELS = 16_000_000
MAX_IMAGE_EDGE = 8_000
MAX_TARGET_CHARS = 80
MAX_TARGET_WORDS = 8
MAX_STREAM_BYTES = 3 * 1024 * 1024
MAX_OBJECTS = 16
MAX_MASK_PATH_CHARS = 350_000
MAX_TOTAL_MASK_PATH_CHARS = 1_000_000
IMAGE_PRICE_ESTIMATE_USD = 0.0025  # Meta's published SAM image rate; estimate only.
ALLOWED_MIME_FORMATS = {
    "image/png": "PNG",
    "image/jpeg": "JPEG",
    "image/webp": "WEBP",
}


class GroundingError(Exception):
    """Safe, user-facing grounding failure; never contains request secrets."""


class GroundingValidationError(GroundingError):
    pass


class GroundingConfigurationError(GroundingError):
    pass


class GroundingTransportError(GroundingError):
    pass


class GroundingTimeoutError(GroundingTransportError):
    pass


class GroundingResponseError(GroundingError):
    pass


@dataclass(frozen=True)
class ValidatedImage:
    data: bytes
    mime_type: str
    width: int
    height: int
    sha256: str


@dataclass(frozen=True)
class GroundObject:
    object_id: str
    label: str
    x: float
    y: float
    width: float
    height: float
    mask_path: str | None
    mask_width: int | None
    mask_height: int | None
    mask_bounds: dict[str, float] | None
    score: float | None


@dataclass(frozen=True)
class GroundingResult:
    model: str
    target_phrase: str
    image_width: int
    image_height: int
    image_sha256: str
    objects: tuple[GroundObject, ...]
    diagnostics: tuple[dict[str, str], ...]
    elapsed_ms: int
    estimated_cost_usd: float
    response_id: str | None


def validate_target_phrase(value: str) -> str:
    phrase = " ".join(value.split())
    if not phrase or len(phrase) > MAX_TARGET_CHARS:
        raise GroundingValidationError(
            f"target_phrase must contain 1 to {MAX_TARGET_CHARS} characters"
        )
    if len(phrase.split()) > MAX_TARGET_WORDS:
        raise GroundingValidationError(
            f"target_phrase must be a short noun phrase of at most {MAX_TARGET_WORDS} words"
        )
    lowered = phrase.casefold()
    if any(ch in phrase for ch in ",;+/?!\n\r") or any(
        ord(ch) < 32 for ch in phrase
    ) or " or " in f" {lowered} " or " either " in f" {lowered} ":
        raise GroundingValidationError(
            "target_phrase must name one object without a question or concept list"
        )
    return phrase


def validate_image(data: bytes, mime_type: str) -> ValidatedImage:
    if mime_type not in ALLOWED_MIME_FORMATS:
        raise GroundingValidationError("Unsupported image type")
    if not data or len(data) > MAX_IMAGE_BYTES:
        raise GroundingValidationError("Image must be between 1 byte and 4 MiB")
    try:
        with Image.open(BytesIO(data)) as probe:
            if probe.format != ALLOWED_MIME_FORMATS[mime_type]:
                raise GroundingValidationError(
                    "Image content does not match the declared image type"
                )
            probe.verify()
        with Image.open(BytesIO(data)) as source:
            image = ImageOps.exif_transpose(source)
            width, height = image.size
            if width <= 0 or height <= 0 or width > MAX_IMAGE_EDGE or height > MAX_IMAGE_EDGE:
                raise GroundingValidationError("Image dimensions are outside the supported range")
            if width * height > MAX_IMAGE_PIXELS:
                raise GroundingValidationError("Image exceeds the supported pixel limit")
            image.load()
    except GroundingValidationError:
        raise
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as exc:
        raise GroundingValidationError("Image content is invalid or could not be decoded") from exc
    return ValidatedImage(
        data=data,
        mime_type=mime_type,
        width=width,
        height=height,
        sha256=hashlib.sha256(data).hexdigest(),
    )


def build_payload(image: ValidatedImage, target_phrase: str) -> dict[str, Any]:
    phrase = validate_target_phrase(target_phrase)
    image_url = f"data:{image.mime_type};base64,{base64.b64encode(image.data).decode('ascii')}"
    return {
        "model": MODEL_ID,
        "input": [{
            "type": "message",
            "role": "user",
            "content": [
                {"type": "input_text", "text": phrase},
                {"type": "input_image", "image_url": image_url},
            ],
        }],
        "stream": True,
        "metadata": {
            "mask_encoding": "one_bit",
            "include_confidence": "true",
        },
    }


def _normalize_records(
    parsed: Any, image: ValidatedImage
) -> tuple[tuple[GroundObject, ...], tuple[dict[str, str], ...]]:
    diagnostics: list[dict[str, str]] = []
    for diagnostic in parsed.diagnostics:
        item = {
            "severity": str(diagnostic.severity),
            "code": str(diagnostic.code),
            "message": str(diagnostic.message)[:240],
        }
        diagnostics.append(item)
        if item["severity"] == "error":
            raise GroundingResponseError("SAM segmentation output failed validation")

    boxes: dict[str, SegmentationBoxRecord] = {}
    masks: dict[str, SegmentationMaskRecord] = {}
    for record in parsed.records:
        if isinstance(record, SegmentationBoxRecord):
            boxes[record.object_id] = record
        elif isinstance(record, SegmentationMaskRecord):
            masks[record.object_id] = record

    if len(boxes) > MAX_OBJECTS:
        raise GroundingResponseError("SAM returned more objects than the response limit")
    if set(masks) - set(boxes):
        raise GroundingResponseError("SAM returned a mask without its matching box")

    objects: list[GroundObject] = []
    total_path_chars = 0
    for object_id, box in boxes.items():
        left, top, right, bottom = box.left, box.top, box.right, box.bottom
        if not all(math.isfinite(v) for v in (left, top, right, bottom)):
            raise GroundingResponseError("SAM returned non-finite box coordinates")
        if (
            left < 0 or top < 0 or right <= left or bottom <= top
            or right > image.width or bottom > image.height
        ):
            raise GroundingResponseError("SAM returned a box outside the source image")

        mask_record = masks.get(object_id)
        mask_path: str | None = None
        mask_width: int | None = None
        mask_height: int | None = None
        mask_bounds: dict[str, float] | None = None
        if mask_record is not None:
            mask = mask_record.mask
            bounds = mask_record.bounds
            if (
                mask.width <= 0 or mask.height <= 0
                or mask.width * mask.height > MAX_IMAGE_PIXELS
                or not all(math.isfinite(v) for v in (
                    bounds.left, bounds.top, bounds.right, bounds.bottom
                ))
                or bounds.left < 0 or bounds.top < 0
                or bounds.right <= bounds.left or bounds.bottom <= bounds.top
                or bounds.right > image.width or bounds.bottom > image.height
            ):
                raise GroundingResponseError("SAM returned invalid mask dimensions or bounds")
            try:
                mask_path = decode_mask_to_svg_path(mask)
            except Exception as exc:
                raise GroundingResponseError("SAM returned a mask that could not be decoded") from exc
            total_path_chars += len(mask_path)
            if len(mask_path) > MAX_MASK_PATH_CHARS or total_path_chars > MAX_TOTAL_MASK_PATH_CHARS:
                raise GroundingResponseError("SAM mask data exceeds the response size limit")
            mask_width, mask_height = mask.width, mask.height
            mask_bounds = {
                "x": bounds.left,
                "y": bounds.top,
                "width": bounds.right - bounds.left,
                "height": bounds.bottom - bounds.top,
            }

        score = box.confidence
        if score is not None and (not math.isfinite(score) or not 0 <= score <= 1):
            raise GroundingResponseError("SAM returned an invalid confidence value")
        objects.append(GroundObject(
            object_id=object_id,
            label="grounded target",
            x=left / image.width,
            y=top / image.height,
            width=(right - left) / image.width,
            height=(bottom - top) / image.height,
            mask_path=mask_path,
            mask_width=mask_width,
            mask_height=mask_height,
            mask_bounds=mask_bounds,
            score=score,
        ))
    return tuple(objects), tuple(diagnostics)


async def _sse_events(response: httpx.Response) -> AsyncIterator[dict[str, Any]]:
    total = 0
    async for line in response.aiter_lines():
        if not line or line.startswith(":") or not line.startswith("data:"):
            continue
        data = line[5:].strip()
        if data == "[DONE]":
            continue
        total += len(data.encode("utf-8"))
        if total > MAX_STREAM_BYTES:
            raise GroundingResponseError("SAM stream exceeded the response size limit")
        try:
            event = json.loads(data)
        except json.JSONDecodeError as exc:
            raise GroundingResponseError("SAM returned malformed stream data") from exc
        if not isinstance(event, dict) or not isinstance(event.get("type"), str):
            raise GroundingResponseError("SAM returned an unexpected stream event")
        yield event


async def parse_event_source(
    source: AsyncIterator[dict[str, Any]], *, image: ValidatedImage,
    target_phrase: str, response_id: str | None = None,
) -> GroundingResult:
    parsed_stream = parse_responses_stream(source, image_segmentation_format())
    try:
        parsed = await parsed_stream.final_result()
    except Exception as exc:
        if isinstance(exc, GroundingError):
            raise
        raise GroundingResponseError(
            f"SAM response could not be parsed ({type(exc).__name__})"
        ) from exc
    if getattr(parsed.outcome, "status", None) != "completed":
        raise GroundingResponseError("SAM stream ended before response.completed")
    objects, diagnostics = _normalize_records(parsed, image)
    return GroundingResult(
        model=MODEL_ID,
        target_phrase=validate_target_phrase(target_phrase),
        image_width=image.width,
        image_height=image.height,
        image_sha256=image.sha256,
        objects=objects,
        diagnostics=diagnostics,
        elapsed_ms=0,
        estimated_cost_usd=0.0,
        response_id=response_id,
    )


def mock_fixture_for(image: ValidatedImage, target_phrase: str) -> dict[str, Any] | None:
    """Return the single synthetic grounding fixture only for its exact image and prompt."""
    from pathlib import Path

    fixture_path = Path(__file__).resolve().parent.parent / "fixtures" / "sam31_synthetic_response.json"
    try:
        fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if (
        fixture.get("provenance") != "SYNTHETIC_OFFLINE_FIXTURE"
        or fixture.get("image_sha256") != image.sha256
        or fixture.get("target_phrase") != validate_target_phrase(target_phrase)
        or fixture.get("image_width") != image.width
        or fixture.get("image_height") != image.height
    ):
        return None
    return fixture


async def parse_mock_fixture(
    fixture: dict[str, Any], *, image: ValidatedImage, target_phrase: str
) -> GroundingResult:
    raw_output = fixture.get("output_text")
    if not isinstance(raw_output, str):
        raise GroundingResponseError("Synthetic SAM fixture is invalid")

    async def events() -> AsyncIterator[dict[str, Any]]:
        lane = {"item_id": "msg_synthetic_sam", "output_index": 0, "content_index": 0}
        if raw_output:
            yield {"type": "response.output_text.delta", "delta": raw_output, **lane}
        yield {"type": "response.output_text.done", "text": raw_output, **lane}
        yield {
            "type": "response.completed",
            "response": {
                "id": "resp_synthetic_sam_fixture",
                "status": "completed",
                "model": MODEL_ID,
            },
        }

    return await parse_event_source(
        events(), image=image, target_phrase=target_phrase,
        response_id="resp_synthetic_sam_fixture",
    )


async def complete_live(
    *, image: ValidatedImage, target_phrase: str, api_key: str | None = None,
    timeout: float = 60.0,
) -> GroundingResult:
    key = api_key or os.environ.get(API_KEY_ENV)
    if not key:
        raise GroundingConfigurationError("Meta SAM credential is not configured")
    payload = build_payload(image, target_phrase)
    timeout_config = httpx.Timeout(timeout, connect=8.0, write=10.0, pool=5.0)
    started = time.monotonic()
    response_id: str | None = None
    completed = False
    try:
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=timeout_config) as client:
            async with client.stream(
                "POST",
                PATH,
                json=payload,
                headers={
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                    "Accept": "text/event-stream",
                },
            ) as response:
                if response.status_code >= 400:
                    status = response.status_code
                    if status in (401, 403):
                        raise GroundingTransportError(
                            f"Meta SAM authentication or model entitlement rejected (HTTP {status})"
                        )
                    if status == 429:
                        raise GroundingTransportError("Meta SAM rate limit reached (HTTP 429)")
                    raise GroundingTransportError(f"Meta SAM request failed (HTTP {status})")

                async def events() -> AsyncIterator[dict[str, Any]]:
                    nonlocal response_id, completed
                    async for event in _sse_events(response):
                        if event["type"] == "response.completed":
                            body = event.get("response")
                            if not isinstance(body, dict) or body.get("status") != "completed":
                                raise GroundingResponseError("SAM did not complete the response")
                            candidate = body.get("id")
                            response_id = candidate if isinstance(candidate, str) else None
                            completed = True
                        yield event

                result = await parse_event_source(
                    events(), image=image, target_phrase=target_phrase
                )
    except GroundingError:
        raise
    except httpx.TimeoutException as exc:
        raise GroundingTimeoutError("Meta SAM request timed out; do not automatically retry") from exc
    except httpx.HTTPError as exc:
        raise GroundingTransportError(f"Meta SAM transport failed ({type(exc).__name__})") from exc
    except Exception as exc:
        # Parser exception text can contain provider output; keep it out of logs/errors.
        raise GroundingResponseError(f"SAM response could not be parsed ({type(exc).__name__})") from exc

    if not completed:
        raise GroundingResponseError("SAM stream ended before response.completed")
    return GroundingResult(
        model=MODEL_ID,
        target_phrase=validate_target_phrase(target_phrase),
        image_width=image.width,
        image_height=image.height,
        image_sha256=image.sha256,
        objects=result.objects,
        diagnostics=result.diagnostics,
        elapsed_ms=int((time.monotonic() - started) * 1000),
        estimated_cost_usd=IMAGE_PRICE_ESTIMATE_USD,
        response_id=response_id,
    )
