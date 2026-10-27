import base64
import binascii
import json
import logging
import os
import time
import uuid
from urllib.parse import urlsplit

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

from app import meta_client, provider_router
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
    allow_headers=["Content-Type"],
    expose_headers=["X-Correlation-ID"],
)


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


class AnalyzeResponse(BaseModel):
    mode: str
    model: str
    objective_length: int
    facts: list[Fact]
    overall_confidence: float
    usage: UsageModel
    elapsed_ms: int


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
    )
