import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Groundline API", version="0.1.0")


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
        if origin and origin not in seen:
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
)


class HealthResponse(BaseModel):
    status: str
    version: str
    mode: str


@app.get("/healthz", response_model=HealthResponse)
def healthz() -> HealthResponse:
    """Liveness probe.

    This endpoint makes no network call to Meta or any model provider, so it is
    never chargeable. ``mode`` reports the service's configured operating mode,
    not a verified upstream connection: the presence of a configured key is not
    treated as proof that a live model call would succeed.

    - ``mode == "MOCK"`` when no model key is configured; per the project
      security rules a mocked path must announce itself as MOCK.
    - ``mode == "live"`` when a model key is configured, meaning the real
      adapter path is selected. It does not assert that Meta is reachable.

    The configured key itself is never returned, logged, or echoed, and the
    response carries no field that discloses the key's value or presence.
    """
    key_configured = bool(os.environ.get("MODEL_API_KEY"))
    return HealthResponse(
        status="ok",
        version=app.version,
        mode="live" if key_configured else "MOCK",
    )
