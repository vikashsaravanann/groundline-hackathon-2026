"""Grounding endpoint tests are synthetic and stay in forced MOCK by default."""
from __future__ import annotations

import base64
from pathlib import Path

from fastapi.testclient import TestClient
from PIL import Image
from io import BytesIO

from app import main, sam_client
from app.main import app

client = TestClient(app)
FIXTURES = Path(__file__).resolve().parent.parent / "fixtures"


def request_body(*, image_bytes: bytes | None = None, target="desk lamp"):
    data = image_bytes or (FIXTURES / "sam31_synthetic_image.png").read_bytes()
    return {
        "mime_type": "image/png",
        "image_base64": base64.b64encode(data).decode("ascii"),
        "target_phrase": target,
    }


def test_forced_mock_ground_returns_exact_synthetic_fixture(monkeypatch):
    monkeypatch.setenv("GROUNDLINE_FEATURE_GROUNDING_ENABLED", "1")
    monkeypatch.setenv("GROUNDLINE_PROVIDER_IMAGE_GROUNDING", "meta-sam")
    monkeypatch.setenv("GROUNDLINE_FORCE_MOCK", "1")

    def no_network(*args, **kwargs):
        raise AssertionError("Forced MOCK must never create a SAM HTTP client")

    monkeypatch.setattr(sam_client.httpx, "AsyncClient", no_network)
    response = client.post("/api/ground", json=request_body())
    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "MOCK"
    assert body["provider"] == "synthetic-fixture"
    assert body["status"] == "completed"
    assert body["model"] == "sam-3.1"
    assert body["image_width"] == 800 and body["image_height"] == 600
    assert body["objects"][0]["object_id"] == "0"
    assert body["objects"][0]["box"] == {
        "x": 190 / 800, "y": 105 / 600, "width": 286 / 800, "height": 420 / 600,
    }
    assert body["objects"][0]["mask"]["encoding"] == "svg-path"
    assert body["objects"][0]["mask"]["bounds"] == {
        "x": 190 / 800, "y": 105 / 600, "width": 286 / 800, "height": 420 / 600,
    }
    assert body["estimated_cost_usd"] == 0
    assert response.headers["X-Correlation-ID"] == body["correlation_id"]


def test_mock_non_fixture_image_is_truthfully_unavailable(monkeypatch):
    monkeypatch.setenv("GROUNDLINE_FEATURE_GROUNDING_ENABLED", "1")
    monkeypatch.setenv("GROUNDLINE_FORCE_MOCK", "1")
    buffer = BytesIO()
    Image.new("RGB", (64, 64), "white").save(buffer, format="PNG")
    response = client.post("/api/ground", json=request_body(image_bytes=buffer.getvalue()))
    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "MOCK"
    assert body["status"] == "mock_unavailable"
    assert body["objects"] == []
    assert body["estimated_cost_usd"] == 0


def test_feature_flag_is_off_by_default_and_returns_not_found(monkeypatch):
    monkeypatch.setenv("GROUNDLINE_FORCE_MOCK", "1")
    monkeypatch.delenv("GROUNDLINE_FEATURE_GROUNDING_ENABLED", raising=False)
    response = client.post("/api/ground", json=request_body())
    assert response.status_code == 404


def test_live_grounding_fails_closed_when_disabled(monkeypatch):
    monkeypatch.setenv("GROUNDLINE_FEATURE_GROUNDING_ENABLED", "1")
    monkeypatch.setenv("GROUNDLINE_FORCE_MOCK", "0")
    monkeypatch.setenv("MODEL_API_KEY", "sentinel-test-key")
    monkeypatch.setenv("GROUNDLINE_LIVE_GROUNDING_ENABLED", "0")
    response = client.post("/api/ground", json=request_body())
    assert response.status_code == 503
    assert response.json()["detail"] == "Live grounding is disabled"


def test_live_grounding_requires_restricted_authorization(monkeypatch):
    monkeypatch.setenv("GROUNDLINE_FEATURE_GROUNDING_ENABLED", "1")
    monkeypatch.setenv("GROUNDLINE_FORCE_MOCK", "0")
    monkeypatch.setenv("GROUNDLINE_LIVE_GROUNDING_ENABLED", "1")
    monkeypatch.setenv("MODEL_API_KEY", "sentinel-test-key")
    monkeypatch.setenv("GROUNDLINE_GROUNDING_ACCESS_TOKEN", "only-test-access-code")
    monkeypatch.delenv("GROUNDLINE_GROUNDING_QUOTA_REDIS_URL", raising=False)
    response = client.post("/api/ground", json=request_body())
    assert response.status_code == 401
    assert "only-test-access-code" not in response.text


def test_live_grounding_requires_shared_quota_store(monkeypatch):
    monkeypatch.setenv("GROUNDLINE_FEATURE_GROUNDING_ENABLED", "1")
    monkeypatch.setenv("GROUNDLINE_FORCE_MOCK", "0")
    monkeypatch.setenv("GROUNDLINE_LIVE_GROUNDING_ENABLED", "1")
    monkeypatch.setenv("MODEL_API_KEY", "sentinel-test-key")
    monkeypatch.setenv("GROUNDLINE_GROUNDING_ACCESS_TOKEN", "only-test-access-code")
    monkeypatch.delenv("GROUNDLINE_GROUNDING_QUOTA_REDIS_URL", raising=False)
    response = client.post(
        "/api/ground", json=request_body(),
        headers={"X-Groundline-Access-Token": "only-test-access-code"},
    )
    assert response.status_code == 503
    assert "quota" in response.json()["detail"].lower()


def test_live_provider_failure_does_not_fall_back_to_mock(monkeypatch):
    class Reservation:
        async def release(self):
            return None

    async def reserve(**kwargs):
        return Reservation()

    async def fail_live(**kwargs):
        raise sam_client.GroundingTransportError("safe provider failure")

    monkeypatch.setenv("GROUNDLINE_FEATURE_GROUNDING_ENABLED", "1")
    monkeypatch.setenv("GROUNDLINE_FORCE_MOCK", "0")
    monkeypatch.setenv("GROUNDLINE_LIVE_GROUNDING_ENABLED", "1")
    monkeypatch.setenv("MODEL_API_KEY", "sentinel-test-key")
    monkeypatch.setenv("GROUNDLINE_GROUNDING_ACCESS_TOKEN", "only-test-access-code")
    monkeypatch.setattr(main.grounding_security, "reserve_live_grounding", reserve)
    monkeypatch.setattr(main.provider_router, "ground_image", fail_live)
    response = client.post(
        "/api/ground", json=request_body(),
        headers={"X-Groundline-Access-Token": "only-test-access-code"},
    )
    assert response.status_code == 502
    assert response.json()["detail"] == "The grounding provider could not complete the request."
    assert "sentinel-test-key" not in response.text


def test_request_body_and_image_byte_limits(monkeypatch):
    monkeypatch.setenv("GROUNDLINE_FEATURE_GROUNDING_ENABLED", "1")
    monkeypatch.setenv("GROUNDLINE_FORCE_MOCK", "1")
    response = client.post("/api/ground", json=request_body(target=""))
    assert response.status_code == 422
    huge = base64.b64encode(b"x" * (main.MAX_IMAGE_BYTES + 1)).decode("ascii")
    oversized = client.post("/api/ground", json={
        "mime_type": "image/png", "image_base64": huge, "target_phrase": "lamp",
    })
    assert oversized.status_code == 422
