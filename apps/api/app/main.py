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
    """Liveness probe for the API service.

    It makes no network call to Meta or any model provider, so it is never
    chargeable; a healthy service is not conflated with a verified Meta model
    connection.

    ``mode`` is docs/SECURITY.md rule 7 in machine-readable form: a mocked path
    must announce itself as MOCK and must never be presented as a live model
    call. It is "live" when MODEL_API_KEY is set (the real adapter path is
    selected) and "MOCK" when it is not. It reflects the configured operating
    mode, not a verified upstream connection. The key value itself is never
    returned, logged, or echoed, and ``meta_key_present`` is deliberately not
    exposed.
    """
    mode = "live" if os.environ.get("MODEL_API_KEY") else "MOCK"
    return HealthResponse(status="ok", version=app.version, mode=mode)
