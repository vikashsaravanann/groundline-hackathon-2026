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


@app.get("/healthz", response_model=HealthResponse)
def healthz() -> HealthResponse:
    """Liveness probe for the API service.

    This reports only that the HTTP service is up. It makes no network call to
    Meta or any model provider, so it is never chargeable, and a healthy service
    is deliberately NOT conflated with a healthy Meta model connection.

    The response discloses nothing about credentials: not the key's value, and
    not whether a key is configured. Any model-path MOCK/live announcement
    required by docs/SECURITY.md belongs on the model-serving path, not on this
    liveness probe, where surfacing it would leak key availability.
    """
    return HealthResponse(status="ok", version=app.version)
