import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Groundline API", version="0.1.0")

_allowed_origins = [
    origin.strip()
    for origin in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

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
    meta_key_present: bool
    mode: str


@app.get("/healthz", response_model=HealthResponse)
def healthz() -> HealthResponse:
    key_present = bool(os.environ.get("MODEL_API_KEY"))
    return HealthResponse(
        status="ok",
        version=app.version,
        meta_key_present=key_present,
        mode="live" if key_present else "MOCK",
    )
