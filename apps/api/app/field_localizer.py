"""Crop a SAM label region and map Muse Spark field positions to source space.

Position-bearing responses are accepted only when Spark returns an explicit,
valid box in crop-relative fractions. Missing or malformed positions never
produce guessed geometry.
"""
from __future__ import annotations

import hashlib
import json
import math
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps

from app import sam_client
from app.model_types import ModelResult

FIXTURE_PATH = "muse_spark_model_number_position.json"
FIELD_PROMPT = (
    "Inspect this crop of a product label. Locate only the printed model-number field. "
    "Return JSON only with this shape: {\"field_name\":\"model number\","
    "\"value\":string or null,\"position\":{\"x\":number,\"y\":number,"
    "\"width\":number,\"height\":number} or null,\"confidence\":number or null}. "
    "Position values must be fractions from 0 to 1 relative to the supplied crop, "
    "with x and y at the top-left. If the model-number field or its position is not "
    "clearly visible, return position:null and confidence:null. Never infer a box."
)


class FieldLocalizationError(Exception):
    """Spark output was unusable; callers can still return the SAM label region."""


@dataclass(frozen=True)
class CroppedLabel:
    image: sam_client.ValidatedImage
    left: int
    top: int
    source_width: int
    source_height: int
    source_sha256: str


@dataclass(frozen=True)
class FieldPosition:
    field_name: str
    value: str | None
    x: float
    y: float
    width: float
    height: float
    confidence: float | None


@dataclass(frozen=True)
class ParsedFieldLocalization:
    status: str
    field: FieldPosition | None
    model_result: ModelResult


def crop_label(
    source: sam_client.ValidatedImage, label: sam_client.GroundObject
) -> CroppedLabel:
    """Crop exactly the pixel extent returned by SAM's normalized label box."""
    values = (label.x, label.y, label.width, label.height)
    if (
        not all(math.isfinite(value) for value in values)
        or label.x < 0 or label.y < 0 or label.width <= 0 or label.height <= 0
        or label.x + label.width > 1.000001 or label.y + label.height > 1.000001
    ):
        raise FieldLocalizationError("SAM label box is outside the source image")
    left = max(0, min(source.width - 1, round(label.x * source.width)))
    top = max(0, min(source.height - 1, round(label.y * source.height)))
    right = max(left + 1, min(source.width, round((label.x + label.width) * source.width)))
    bottom = max(top + 1, min(source.height, round((label.y + label.height) * source.height)))
    try:
        with Image.open(BytesIO(source.data)) as opened:
            oriented = ImageOps.exif_transpose(opened).convert("RGB")
            crop = oriented.crop((left, top, right, bottom))
            output = BytesIO()
            crop.save(output, format="PNG", optimize=True)
    except (OSError, ValueError) as exc:
        raise FieldLocalizationError("SAM label crop could not be decoded") from exc
    image = sam_client.validate_image(output.getvalue(), "image/png")
    return CroppedLabel(image, left, top, source.width, source.height, source.sha256)


def crop_data_url(crop: CroppedLabel) -> str:
    import base64

    encoded = base64.b64encode(crop.image.data).decode("ascii")
    return f"data:{crop.image.mime_type};base64,{encoded}"


def mock_fixture_for(crop: CroppedLabel) -> dict[str, Any] | None:
    fixture_root = Path(__file__).resolve().parent.parent / "fixtures"
    # Prefer a completed authentic response when one exists. An incomplete
    # authentic response remains documentary evidence and must not be used as
    # a successful MOCK result; the clearly named synthetic fixture supports
    # deterministic offline UI/tests in that case.
    paths = [
        fixture_root / FIXTURE_PATH,
        fixture_root / "muse_spark_model_number_position_synthetic.json",
    ]
    for path in paths:
        try:
            fixture = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        response = fixture.get("response")
        if (
            fixture.get("provenance") not in {
                "SYNTHETIC_OFFLINE_FIXTURE",
                "LIVE_META_MUSE_SPARK_CROP_POSITION",
            }
            # PNG encoder output can differ across Pillow/Python versions.
            # Bind the offline response to the exact approved source image and
            # returned crop geometry instead of the encoded crop bytes.
            or fixture.get("source_image_sha256") != crop.source_sha256
            or fixture.get("crop_box") != {
                "left": crop.left,
                "top": crop.top,
                "width": crop.image.width,
                "height": crop.image.height,
            }
            or fixture.get("crop_width") != crop.image.width
            or fixture.get("crop_height") != crop.image.height
            or not isinstance(response, dict)
            or response.get("status") != "completed"
        ):
            continue
        return fixture
    return None


def _fraction(value: object, name: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise FieldLocalizationError(f"Spark returned an invalid {name}")
    result = float(value)
    if not math.isfinite(result) or result < 0 or result > 1:
        raise FieldLocalizationError(f"Spark returned an out-of-range {name}")
    return result


def parse_position(text: str, result: ModelResult, crop: CroppedLabel) -> ParsedFieldLocalization:
    try:
        payload = json.loads(text)
    except (TypeError, json.JSONDecodeError) as exc:
        raise FieldLocalizationError("Spark field response was not valid JSON") from exc
    if not isinstance(payload, dict):
        raise FieldLocalizationError("Spark field response was not a JSON object")
    raw_position = payload.get("position")
    if raw_position is None:
        return ParsedFieldLocalization("no_position", None, result)
    if not isinstance(raw_position, dict):
        raise FieldLocalizationError("Spark field position was malformed")

    field_name = payload.get("field_name")
    if not isinstance(field_name, str) or "model" not in field_name.casefold():
        raise FieldLocalizationError("Spark did not identify the model-number field")
    x = _fraction(raw_position.get("x"), "position x")
    y = _fraction(raw_position.get("y"), "position y")
    width = _fraction(raw_position.get("width"), "position width")
    height = _fraction(raw_position.get("height"), "position height")
    if width <= 0 or height <= 0 or x + width > 1.000001 or y + height > 1.000001:
        raise FieldLocalizationError("Spark returned a model-number box outside the crop")
    confidence_raw = payload.get("confidence")
    confidence = None if confidence_raw is None else _fraction(confidence_raw, "confidence")
    value_raw = payload.get("value")
    if value_raw is not None and not isinstance(value_raw, str):
        raise FieldLocalizationError("Spark returned an invalid model-number value")

    source_width = crop.source_width
    source_height = crop.source_height
    field = FieldPosition(
        field_name=field_name,
        value=value_raw,
        x=(crop.left + x * crop.image.width) / source_width,
        y=(crop.top + y * crop.image.height) / source_height,
        width=width * crop.image.width / source_width,
        height=height * crop.image.height / source_height,
        confidence=confidence,
    )
    return ParsedFieldLocalization("found", field, result)
