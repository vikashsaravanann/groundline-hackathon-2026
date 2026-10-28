import base64
import binascii
import hashlib
import json
import logging
import os
import re
import time
import uuid
from pathlib import Path
from urllib.parse import urlsplit

from fastapi import FastAPI, Header, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from app import grounding_security, meta_client, provider_router, sam_client, sam_parser
from app.model_types import Capability, ProviderError

app = FastAPI(title="Groundline API", version="0.1.0")

# Request tracing for the model path. The log line carries the model id, the
# reasoning effort used, token counts, elapsed time, status, and a running cost
# estimate — but never the API key, the image bytes, the image data URL, or any
# user-supplied text. The objective's length is logged, not the objective.
logger = logging.getLogger("groundline.analyze")

# Running spend estimate from token counts. Only live calls have a request cost;
# fixture token counts are descriptive and MOCK cost is always reported as zero.
_cumulative_live_cost_usd = 0.0


def _parse_origins(raw: str) -> list[str]:
    """Parse a comma-separated origin allowlist.

    Whitespace is stripped and empty entries dropped so a malformed value such
    as ``",, http://localhost:3000 ,"`` cannot inject a blank origin. Order is
    preserved and duplicates removed. No wildcard is synthesised: only the exact
    origins listed are allowed.
    """
    seen: list[str] = []
    for origin in raw.split(","):
        origin = origin.strip()
        if not origin:
            continue
        if origin == "*":
            raise ValueError("ALLOWED_ORIGINS must list exact origins; wildcard is not allowed")
        parsed = urlsplit(origin)
        if (
            parsed.scheme not in {"http", "https"}
            or not parsed.netloc
            or parsed.path != ""
            or parsed.query
            or parsed.fragment
            or parsed.username
            or parsed.password
        ):
            raise ValueError(f"ALLOWED_ORIGINS entry is not an origin: {origin!r}")
        if origin not in seen:
            seen.append(origin)
    return seen


_allowed_origins = _parse_origins(
    os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Groundline-Access-Token"],
    expose_headers=["X-Correlation-ID"],
)


class GroundingBodyLimitMiddleware:
    """Bound the grounding JSON body before FastAPI parses its base64 string."""

    def __init__(self, asgi_app, *, limit: int = 6 * 1024 * 1024):
        self.app = asgi_app
        self.limit = limit

    async def __call__(self, scope, receive, send):
        if scope.get("type") != "http" or scope.get("path") != "/api/ground" or scope.get("method") != "POST":
            await self.app(scope, receive, send)
            return

        chunks: list[bytes] = []
        total = 0
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            chunk = message.get("body", b"")
            total += len(chunk)
            if total > self.limit:
                body = b'{"detail":"Grounding request body is too large"}'
                await send({"type": "http.response.start", "status": 413, "headers": [(b"content-type", b"application/json"), (b"content-length", str(len(body)).encode())]})
                await send({"type": "http.response.body", "body": body})
                return
            chunks.append(chunk)
            if not message.get("more_body", False):
                break

        body = b"".join(chunks)
        delivered = False

        async def replay_receive():
            nonlocal delivered
            if delivered:
                return {"type": "http.request", "body": b"", "more_body": False}
            delivered = True
            return {"type": "http.request", "body": body, "more_body": False}

        await self.app(scope, replay_receive, send)


app.add_middleware(GroundingBodyLimitMiddleware)


class HealthResponse(BaseModel):
    status: str
    version: str
    mode: str


@app.get("/healthz", response_model=HealthResponse)
def healthz() -> HealthResponse:
    """Liveness probe for the API service.

    It makes no network call to Meta or any model provider, so it is never
    chargeable; a healthy service is not conflated with a verified Meta model
    connection.

    ``mode`` is docs/SECURITY.md rule 7 in machine-readable form: a mocked path
    must announce itself as MOCK and must never be presented as a live model
    call. It follows the same mode selector as inference, including
    ``GROUNDLINE_FORCE_MOCK``. A "live" mode means the live adapter is
    configured, not that the upstream is reachable. The key value itself is
    never returned, logged, or echoed, and ``meta_key_present`` is deliberately
    not exposed.
    """
    mode = "MOCK" if provider_router.use_mock(Capability.IMAGE_FACT_EXTRACTION) else "live"
    return HealthResponse(status="ok", version=app.version, mode=mode)


# --- /api/analyze -----------------------------------------------------------

# The byte ceiling the frontend (apps/web) must also enforce before upload.
MAX_IMAGE_BYTES = 4 * 1024 * 1024
MAX_OBJECTIVE_CHARS = 500
ALLOWED_IMAGE_MIME = ("image/png", "image/jpeg", "image/webp")


def _decode_image_payload(value: str) -> bytes:
    """Decode a base64 image body, tolerating an optional data-URL prefix."""
    payload = value.split(",", 1)[1] if value.startswith("data:") else value
    return base64.b64decode(payload, validate=True)


class AnalyzeRequest(BaseModel):
    """A bounded analyze request. Every rejection carries a human-readable
    message; nothing here reaches a model until it validates."""

    objective: str
    mime_type: str
    image_base64: str

    @field_validator("objective")
    @classmethod
    def _check_objective(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("objective must not be empty")
        if len(value) > MAX_OBJECTIVE_CHARS:
            raise ValueError(
                f"objective must be at most {MAX_OBJECTIVE_CHARS} characters "
                f"(got {len(value)})"
            )
        return value

    @field_validator("mime_type")
    @classmethod
    def _check_mime(cls, value: str) -> str:
        if value not in ALLOWED_IMAGE_MIME:
            raise ValueError(
                f"unsupported image type {value!r}; "
                f"allowed types are {', '.join(ALLOWED_IMAGE_MIME)}"
            )
        return value

    @field_validator("image_base64")
    @classmethod
    def _check_image(cls, value: str) -> str:
        try:
            raw = _decode_image_payload(value)
        except (binascii.Error, ValueError):
            raise ValueError("image_base64 is not valid base64 image data")
        if not raw:
            raise ValueError("image must not be empty")
        if len(raw) > MAX_IMAGE_BYTES:
            raise ValueError(
                f"image is {len(raw)} bytes, over the {MAX_IMAGE_BYTES} byte ceiling"
            )
        return value


class Fact(BaseModel):
    label: str
    value: str
    confidence: float


class UsageModel(BaseModel):
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost_usd: float


class FractionalRegionResponse(BaseModel):
    """Image-relative geometry; x/y/width/height each use a 0..1 scale."""

    x: float
    y: float
    width: float
    height: float


class AnalyzeResponse(BaseModel):
    status: str = "completed"
    mode: str
    model: str
    objective_length: int
    facts: list[Fact]
    overall_confidence: float
    usage: UsageModel
    elapsed_ms: int
    target_found: bool
    target_region: FractionalRegionResponse | None
    target_phrase: str | None = None
    refusal_message: str | None = None


def _out_of_scope_refusal(objective: str) -> tuple[str, str] | None:
    """Return a designed refusal before any model provider is invoked."""
    normalized = re.sub(r"\s+", " ", objective.casefold()).strip()
    medical_document = re.search(
        r"\b(medical|prescription|patient|clinical|diagnos(?:e|is|ing)|dosage|blood test|lab result)\b",
        normalized,
    )
    if medical_document and re.search(
        r"\b(document|record|prescription|diagnos(?:e|is|ing)|interpret|explain|read|advice|result)\b",
        normalized,
    ):
        return (
            "OUT_OF_SCOPE_MEDICAL",
            "Groundline cannot interpret medical documents or provide medical guidance. Please consult a qualified medical professional. This request was not sent to an AI provider.",
        )
    electrical_work = re.search(r"\b(electrical|electric|wiring|wire|mains)\b", normalized)
    repair_guidance = re.search(
        r"\b(repair|fix|guidance|instructions|how to|rewire|troubleshoot)\b", normalized
    )
    if electrical_work and repair_guidance:
        return (
            "OUT_OF_SCOPE_ELECTRICAL_REPAIR",
            "Groundline cannot provide electrical wiring repair guidance. Electrical work can be dangerous; consult a qualified electrician. This request was not sent to an AI provider.",
        )
    return None


def _recorded_sam_target(raw_image: bytes, mime_type: str):
    """Use authentic SAM evidence only for its exact recorded source image.

    Analyze stays single-provider and safe for the public MOCK deployment: it
    does not launch an implicit second, billable inference. Other images return
    no target; the explicit /api/ground action handles new SAM requests.
    """
    expected_sha256 = "34a031a10d9910ea89141015600be473f3cb33933687e6e5cedc2934a202cbc4"
    if hashlib.sha256(raw_image).hexdigest() != expected_sha256:
        return None
    try:
        image = sam_client.validate_image(raw_image, mime_type)
        raw_path = Path(__file__).resolve().parent.parent / "fixtures" / "sam31_prompt_white_rectangle.raw.txt"
        boxes = sam_parser.parse_output_text(raw_path.read_text(encoding="utf-8"))
    except (OSError, sam_client.GroundingValidationError):
        return None
    if not boxes or boxes[0].width != image.width or boxes[0].height != image.height:
        return None
    return sam_parser.to_image_fractions(boxes[0])


MAX_GROUND_BASE64_CHARS = 5_600_100
MAX_GROUND_TARGET_CHARS = sam_client.MAX_TARGET_CHARS


class GroundingRequest(BaseModel):
    mime_type: str
    image_base64: str = Field(max_length=MAX_GROUND_BASE64_CHARS)
    target_phrase: str

    @field_validator("mime_type")
    @classmethod
    def _ground_mime(cls, value: str) -> str:
        if value not in sam_client.ALLOWED_MIME_FORMATS:
            raise ValueError("unsupported image type; use PNG, JPEG or WebP")
        return value

    @field_validator("image_base64")
    @classmethod
    def _ground_image_payload(cls, value: str) -> str:
        try:
            raw = base64.b64decode(
                value.split(",", 1)[1] if value.startswith("data:") else value,
                validate=True,
            )
        except (binascii.Error, ValueError, IndexError):
            raise ValueError("image_base64 is not valid base64 image data")
        if not raw or len(raw) > MAX_IMAGE_BYTES:
            raise ValueError("image must be between 1 byte and 4 MiB")
        return value

    @field_validator("target_phrase")
    @classmethod
    def _ground_target(cls, value: str) -> str:
        try:
            return sam_client.validate_target_phrase(value)
        except sam_client.GroundingValidationError as exc:
            raise ValueError(str(exc)) from exc


class GroundBox(BaseModel):
    x: float
    y: float
    width: float
    height: float


class GroundMask(BaseModel):
    encoding: str
    path: str
    width: int
    height: int
    bounds: GroundBox


class GroundObjectResponse(BaseModel):
    object_id: str
    label: str
    box: GroundBox
    mask: GroundMask | None
    score: float | None


class GroundingResponse(BaseModel):
    mode: str
    provider: str
    model: str
    status: str
    image_width: int
    image_height: int
    image_sha256: str
    target_phrase: str
    objects: list[GroundObjectResponse]
    diagnostics: list[dict[str, str]]
    correlation_id: str
    response_id: str | None = None
    elapsed_ms: int
    estimated_cost_usd: float


def _clamp(value: object, default: float = 0.0) -> float:
    try:
        return min(1.0, max(0.0, float(value)))  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return default


def _facts_from_text(text: str) -> tuple[list[Fact], float]:
    """Turn the model's JSON text into structured facts.

    If the model did not return the agreed JSON, its raw text is surfaced as a
    single zero-confidence fact rather than inventing structure.
    """
    try:
        data = json.loads(text)
    except (json.JSONDecodeError, TypeError):
        data = None

    facts: list[Fact] = []
    if isinstance(data, dict) and isinstance(data.get("facts"), list):
        for item in data["facts"]:
            if not isinstance(item, dict):
                continue
            label = str(item.get("label", "")).strip()
            value = str(item.get("value", "")).strip()
            if not (label or value):
                continue
            facts.append(
                Fact(
                    label=label or "fact",
                    value=value,
                    confidence=_clamp(item.get("confidence", 0.0)),
                )
            )

    if not facts:
        snippet = (text or "").strip()[:MAX_OBJECTIVE_CHARS]
        return [Fact(label="raw_model_output", value=snippet, confidence=0.0)], 0.0

    if isinstance(data, dict) and "overall_confidence" in data:
        overall = _clamp(data["overall_confidence"])
    else:
        overall = round(sum(f.confidence for f in facts) / len(facts), 3)
    return facts, overall


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest, response: Response) -> AnalyzeResponse:
    """Ground the visible facts in a single still image against an objective.

    The response always carries ``mode`` (rule 7): "MOCK" when served from a
    fixture, "live" when it came from the model. No credential is ever returned.

    Every call is traced with a correlation ID (also returned as the
    ``X-Correlation-ID`` header). MOCK fixture usage is not billable: its
    reported cost is zero even though the fixture contains sample token counts.
    """
    global _cumulative_live_cost_usd

    cid = uuid.uuid4().hex[:12]
    response.headers["X-Correlation-ID"] = cid
    effort = meta_client.DEFAULT_EFFORT
    objective_len = len(req.objective)
    started = time.monotonic()

    refusal = _out_of_scope_refusal(req.objective)
    if refusal is not None:
        code, message = refusal
        elapsed_ms = int((time.monotonic() - started) * 1000)
        logger.info(
            "analyze cid=%s status=refused code=%s objective_len=%d elapsed_ms=%d",
            cid, code, objective_len, elapsed_ms,
        )
        return AnalyzeResponse(
            status="refused",
            mode="UNAVAILABLE",
            model="none",
            objective_length=objective_len,
            facts=[],
            overall_confidence=0.0,
            usage=UsageModel(
                input_tokens=0, output_tokens=0, total_tokens=0, estimated_cost_usd=0.0
            ),
            elapsed_ms=elapsed_ms,
            target_found=False,
            target_region=None,
            target_phrase=None,
            refusal_message=message,
        )

    data_url = (
        req.image_base64
        if req.image_base64.startswith("data:")
        else f"data:{req.mime_type};base64,{req.image_base64}"
    )
    try:
        result = provider_router.call_model(
            capability=Capability.IMAGE_FACT_EXTRACTION,
            image_data_url=data_url,
            objective=req.objective,
            effort=effort,
        )
    except ProviderError as exc:
        elapsed_ms = int((time.monotonic() - started) * 1000)
        # Log the exception type only — never the message, image, or objective.
        logger.warning(
            "analyze cid=%s status=error effort=%s objective_len=%d "
            "elapsed_ms=%d error=%s",
            cid,
            effort,
            objective_len,
            elapsed_ms,
            type(exc).__name__,
        )
        raise HTTPException(status_code=502, detail=f"model request failed: {exc}")

    elapsed_ms = int((time.monotonic() - started) * 1000)
    request_cost = result.usage.estimated_cost_usd if result.mode == "live" else 0.0
    if result.mode == "live":
        _cumulative_live_cost_usd += request_cost

    logger.info(
        "analyze cid=%s mode=%s model=%s effort=%s in_tok=%d out_tok=%d "
        "total_tok=%d status=%s objective_len=%d elapsed_ms=%d "
        "req_cost_usd=%.6f cum_live_cost_usd=%.6f",
        cid,
        result.mode,
        result.model,
        effort,
        result.usage.input_tokens,
        result.usage.output_tokens,
        result.usage.total_tokens,
        result.status,
        objective_len,
        elapsed_ms,
        request_cost,
        _cumulative_live_cost_usd,
    )

    facts, overall = _facts_from_text(result.text)
    raw_image = _decode_image_payload(req.image_base64)
    target_region = _recorded_sam_target(raw_image, req.mime_type)
    return AnalyzeResponse(
        mode=result.mode,
        model=result.model,
        objective_length=len(req.objective),
        facts=facts,
        overall_confidence=overall,
        usage=UsageModel(
            input_tokens=result.usage.input_tokens,
            output_tokens=result.usage.output_tokens,
            total_tokens=result.usage.total_tokens,
            estimated_cost_usd=request_cost,
        ),
        elapsed_ms=result.elapsed_ms,
        status="completed",
        target_found=target_region is not None,
        target_region=(
            FractionalRegionResponse(**target_region.__dict__)
            if target_region is not None else None
        ),
        target_phrase="white rectangle" if target_region is not None else None,
    )


def _ground_error_status(exc: Exception) -> tuple[int, str]:
    if isinstance(exc, sam_client.GroundingValidationError):
        return 422, str(exc)
    if isinstance(exc, sam_client.GroundingTimeoutError):
        return 504, "Grounding timed out. Do not automatically resubmit until you confirm the previous request ended."
    if isinstance(exc, sam_client.GroundingConfigurationError):
        return 503, "Live grounding is not configured."
    if isinstance(exc, sam_client.GroundingTransportError):
        return 502, "The grounding provider could not complete the request."
    if isinstance(exc, sam_client.GroundingResponseError):
        return 502, "The grounding provider returned an invalid response."
    return 502, "Grounding failed."


@app.post("/api/ground", response_model=GroundingResponse)
async def ground(
    req: GroundingRequest,
    request: Request,
    response: Response,
    access_token: str | None = Header(default=None, alias="X-Groundline-Access-Token"),
) -> GroundingResponse:
    """Ground one user-selected image and one explicit noun phrase.

    The public forced-MOCK path is nonbillable and returns only an exact-match
    synthetic fixture. LIVE is disabled unless server-side enablement, a
    restricted access token and a shared Redis quota store are all available.
    """
    cid = uuid.uuid4().hex[:12]
    response.headers["X-Correlation-ID"] = cid
    if os.environ.get("GROUNDLINE_FEATURE_GROUNDING_ENABLED") != "1":
        raise HTTPException(status_code=404, detail="Grounding is not enabled")

    try:
        raw = _decode_image_payload(req.image_base64)
        image = sam_client.validate_image(raw, req.mime_type)
    except sam_client.GroundingValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except (binascii.Error, ValueError, IndexError) as exc:
        raise HTTPException(status_code=422, detail="Image payload is invalid") from exc

    forced_mock = os.environ.get("GROUNDLINE_FORCE_MOCK") == "1"
    started = time.monotonic()
    reservation: grounding_security.GroundingReservation | None = None
    if not forced_mock:
        if os.environ.get("GROUNDLINE_LIVE_GROUNDING_ENABLED") != "1":
            raise HTTPException(status_code=503, detail="Live grounding is disabled")
        if not os.environ.get(sam_client.API_KEY_ENV):
            raise HTTPException(status_code=503, detail="Live grounding is not configured")
        if not grounding_security.token_is_valid(access_token):
            raise HTTPException(status_code=401, detail="Restricted grounding access is required")
        client_ip = request.client.host if request.client else "unknown"
        try:
            reservation = await grounding_security.reserve_live_grounding(
                access_token=access_token or "", client_ip=client_ip
            )
        except grounding_security.GroundingQuotaExceeded as exc:
            raise HTTPException(status_code=429, detail="Grounding request quota exceeded") from exc
        except grounding_security.GroundingQuotaUnavailable as exc:
            raise HTTPException(status_code=503, detail="Shared grounding quota is unavailable") from exc

    try:
        result = await provider_router.ground_image(
            image=image, target_phrase=req.target_phrase
        )
        mode = "live" if result is not None and not forced_mock else "MOCK"
        status = (
            "mock_unavailable" if result is None and forced_mock
            else "no_match" if result is not None and not result.objects
            else "multiple_candidates" if result is not None and len(result.objects) > 1
            else "completed"
        )
        objects: list[GroundObjectResponse] = []
        if result is not None:
            for item in result.objects:
                mask = None
                if item.mask_path is not None and item.mask_bounds is not None:
                    mask = GroundMask(
                        encoding="svg-path",
                        path=item.mask_path,
                        width=item.mask_width or 0,
                        height=item.mask_height or 0,
                        bounds=GroundBox(
                            x=item.mask_bounds["x"] / image.width,
                            y=item.mask_bounds["y"] / image.height,
                            width=item.mask_bounds["width"] / image.width,
                            height=item.mask_bounds["height"] / image.height,
                        ),
                    )
                objects.append(GroundObjectResponse(
                    object_id=item.object_id,
                    label=req.target_phrase,
                    box=GroundBox(
                        x=item.x, y=item.y, width=item.width, height=item.height
                    ),
                    mask=mask,
                    score=item.score,
                ))
        elapsed = result.elapsed_ms if result is not None else int((time.monotonic() - started) * 1000)
        cost = result.estimated_cost_usd if mode == "live" and result else 0.0
        model = result.model if result else sam_client.MODEL_ID
        if status == "no_match":
            status = "no_match"
        logger.info(
            "ground cid=%s mode=%s model=%s status=%s target_len=%d objects=%d elapsed_ms=%d estimated_cost_usd=%.6f",
            cid, mode, model, status, len(req.target_phrase), len(objects), elapsed, cost,
        )
        return GroundingResponse(
            mode=mode,
            provider="meta-sam" if mode == "live" else "synthetic-fixture",
            model=model,
            status=status,
            image_width=image.width,
            image_height=image.height,
            image_sha256=image.sha256,
            target_phrase=req.target_phrase,
            objects=objects,
            diagnostics=list(result.diagnostics) if result else [],
            correlation_id=cid,
            response_id=result.response_id if result else None,
            elapsed_ms=elapsed,
            estimated_cost_usd=cost,
        )
    except sam_client.GroundingError as exc:
        status_code, message = _ground_error_status(exc)
        logger.warning("ground cid=%s status=error error=%s", cid, type(exc).__name__)
        raise HTTPException(status_code=status_code, detail=message) from exc
    finally:
        if reservation is not None:
            try:
                await reservation.release()
            except Exception:
                logger.error("ground cid=%s quota_release=failed", cid)
