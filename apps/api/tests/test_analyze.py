"""Offline tests for the Meta Model adapter and the /api/analyze endpoint.

No test makes a network call. The live path is exercised with a fake httpx
client that replays the recorded fixture, so the credential-leak and payload
assertions run without spending a token.
"""
import base64
import logging
import socket

import pytest
from fastapi.testclient import TestClient

from app import main, meta_client
from app.main import app

client = TestClient(app)

# A sentinel key shaped like a real one (keys start "LLM_"). Never a real
# credential; tests assert this exact string never reaches a response.
SENTINEL_KEY = "LLM_SENTINEL_DO_NOT_DISCLOSE_0123456789"

# Smallest valid request image: a 1x1 PNG.
TINY_PNG_B64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGA"
    "WjR9awAAAABJRU5ErkJggg=="
)


def _valid_request(**overrides) -> dict:
    body = {
        "objective": "log this product's name and best-before date",
        "mime_type": "image/png",
        "image_base64": TINY_PNG_B64,
    }
    body.update(overrides)
    return body


# --- typed-output parser ----------------------------------------------------


def test_parser_reads_recorded_fixture():
    # The recorded response has a reasoning item then a message item, and no
    # top-level output_text, so this genuinely exercises the output[] walk.
    body = meta_client._load_fixture(meta_client.DEFAULT_FIXTURE)
    result = meta_client.parse_response(body, elapsed_ms=5, mode="MOCK")
    assert result.status == "completed"
    assert result.model == "muse-spark-1.3"
    assert result.text.strip().startswith("{")  # the message text, not reasoning
    assert result.usage.input_tokens == 132
    assert result.usage.output_tokens == 259
    assert result.usage.total_tokens == 391
    assert result.usage.estimated_cost_usd > 0


def test_parser_skips_reasoning_item():
    # Construct an envelope whose reasoning item carries text; it must be
    # ignored in favour of the message item.
    body = {
        "status": "completed",
        "model": "muse-spark-1.3",
        "output": [
            {"type": "reasoning", "content": [{"type": "output_text", "text": "THINK"}]},
            {"type": "message", "content": [{"type": "output_text", "text": "ANSWER"}]},
        ],
        "usage": {"input_tokens": 1, "output_tokens": 1, "total_tokens": 2},
    }
    result = meta_client.parse_response(body, elapsed_ms=0, mode="live")
    assert result.text == "ANSWER"


def test_incomplete_status_raises_rather_than_returning_empty():
    body = {"status": "incomplete", "error": None, "output": [], "usage": {}}
    with pytest.raises(meta_client.MetaResponseError):
        meta_client.parse_response(body, elapsed_ms=0, mode="live")


def test_error_envelope_raises():
    body = {"status": "completed", "error": {"message": "boom"}, "output": []}
    with pytest.raises(meta_client.MetaResponseError):
        meta_client.parse_response(body, elapsed_ms=0, mode="live")


def test_completed_but_empty_text_raises():
    body = {"status": "completed", "error": None, "output": [], "usage": {}}
    with pytest.raises(meta_client.MetaResponseError):
        meta_client.parse_response(body, elapsed_ms=0, mode="live")


def test_bad_effort_rejected_before_any_call():
    with pytest.raises(ValueError):
        meta_client.call_model(input="x", effort="turbo")


# --- validation (four rejections) -------------------------------------------


def test_rejects_empty_objective():
    r = client.post("/api/analyze", json=_valid_request(objective="   "))
    assert r.status_code == 422
    assert "objective must not be empty" in r.text


def test_rejects_objective_over_500_chars():
    r = client.post("/api/analyze", json=_valid_request(objective="x" * 501))
    assert r.status_code == 422
    assert "at most 500 characters" in r.text


def test_rejects_unsupported_mime():
    r = client.post("/api/analyze", json=_valid_request(mime_type="application/pdf"))
    assert r.status_code == 422
    assert "unsupported image type" in r.text


def test_rejects_image_over_byte_ceiling():
    oversized = base64.b64encode(b"\x00" * (main.MAX_IMAGE_BYTES + 1)).decode()
    r = client.post("/api/analyze", json=_valid_request(image_base64=oversized))
    assert r.status_code == 422
    assert "byte ceiling" in r.text


def test_rejects_invalid_base64():
    r = client.post("/api/analyze", json=_valid_request(image_base64="@@@not-valid@@@"))
    assert r.status_code == 422
    assert "not valid base64" in r.text


# --- MOCK path --------------------------------------------------------------


def test_analyze_mock_returns_structured_facts(monkeypatch):
    monkeypatch.delenv("MODEL_API_KEY", raising=False)
    monkeypatch.setenv("GROUNDLINE_FORCE_MOCK", "1")
    r = client.post("/api/analyze", json=_valid_request())
    assert r.status_code == 200
    body = r.json()
    assert body["mode"] == "MOCK"
    assert body["facts"] and all("confidence" in f for f in body["facts"])
    assert 0.0 <= body["overall_confidence"] <= 1.0
    assert body["objective_length"] == len(_valid_request()["objective"])


def test_force_mock_makes_no_network_call(monkeypatch):
    # With FORCE_MOCK=1 the adapter must never construct an httpx client, even
    # when a key is present.
    monkeypatch.setenv("MODEL_API_KEY", SENTINEL_KEY)
    monkeypatch.setenv("GROUNDLINE_FORCE_MOCK", "1")

    def _boom(*args, **kwargs):
        raise AssertionError("adapter attempted a network client under FORCE_MOCK")

    monkeypatch.setattr(meta_client.httpx, "Client", _boom)

    def _blocked_connect(*args, **kwargs):
        raise AssertionError("adapter attempted an outbound socket under FORCE_MOCK")

    monkeypatch.setattr(socket.socket, "connect", _blocked_connect)

    r = client.post("/api/analyze", json=_valid_request())
    assert r.status_code == 200
    assert r.json()["mode"] == "MOCK"


# --- live path, replayed offline --------------------------------------------


class _FakeResponse:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


class _FakeClient:
    """Stands in for httpx.Client. Captures the request, replays the fixture."""

    captured: dict = {}

    def __init__(self, *args, **kwargs):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def post(self, path, json=None, headers=None):
        _FakeClient.captured = {"path": path, "json": json, "headers": headers}
        return _FakeResponse(200, meta_client._load_fixture(meta_client.DEFAULT_FIXTURE))


def test_live_path_never_leaks_key_and_pins_cost_controls(monkeypatch):
    monkeypatch.setenv("MODEL_API_KEY", SENTINEL_KEY)
    monkeypatch.delenv("GROUNDLINE_FORCE_MOCK", raising=False)
    monkeypatch.setattr(meta_client.httpx, "Client", _FakeClient)

    r = client.post("/api/analyze", json=_valid_request())
    assert r.status_code == 200
    body = r.json()
    assert body["mode"] == "live"

    # The response must not disclose the key or its markers anywhere.
    for forbidden in (SENTINEL_KEY, "Bearer", "LLM_"):
        assert forbidden not in r.text
        assert forbidden not in str(dict(r.headers))

    # Cost controls are pinned on every live request.
    sent = _FakeClient.captured["json"]
    assert sent["store"] is False
    assert sent["reasoning"]["effort"] == meta_client.DEFAULT_EFFORT
    assert sent["model"] == meta_client.MODEL_ID
    # The key is sent upstream as a Bearer token (but never returned above).
    assert _FakeClient.captured["headers"]["Authorization"] == f"Bearer {SENTINEL_KEY}"


def test_client_error_maps_to_502_without_leaking(monkeypatch):
    monkeypatch.setenv("MODEL_API_KEY", SENTINEL_KEY)
    monkeypatch.delenv("GROUNDLINE_FORCE_MOCK", raising=False)

    class _ErrClient(_FakeClient):
        def post(self, path, json=None, headers=None):
            return _FakeResponse(400, {})

    monkeypatch.setattr(meta_client.httpx, "Client", _ErrClient)
    r = client.post("/api/analyze", json=_valid_request())
    assert r.status_code == 502
    for forbidden in (SENTINEL_KEY, "Bearer", "LLM_"):
        assert forbidden not in r.text


def test_exception_messages_never_contain_key(monkeypatch):
    monkeypatch.setenv("MODEL_API_KEY", SENTINEL_KEY)
    monkeypatch.delenv("GROUNDLINE_FORCE_MOCK", raising=False)

    class _ErrClient(_FakeClient):
        def post(self, path, json=None, headers=None):
            return _FakeResponse(503, {})

    monkeypatch.setattr(meta_client.httpx, "Client", _ErrClient)
    with pytest.raises(meta_client.MetaClientError) as excinfo:
        meta_client.call_model(input="x")
    assert SENTINEL_KEY not in str(excinfo.value)
    assert "Bearer" not in str(excinfo.value)


# --- request tracing --------------------------------------------------------


def test_trace_logs_length_not_objective_and_sets_correlation_id(monkeypatch, caplog):
    monkeypatch.delenv("MODEL_API_KEY", raising=False)
    monkeypatch.setenv("GROUNDLINE_FORCE_MOCK", "1")
    secret_objective = "SECRET-OBJECTIVE-TEXT-must-not-be-logged-verbatim"

    with caplog.at_level(logging.INFO, logger="groundline.analyze"):
        r = client.post("/api/analyze", json=_valid_request(objective=secret_objective))

    assert r.status_code == 200
    assert r.headers.get("X-Correlation-ID")  # correlation id returned

    line = "\n".join(rec.getMessage() for rec in caplog.records)
    assert "analyze cid=" in line
    assert "mode=MOCK" in line
    assert f"objective_len={len(secret_objective)}" in line
    # The objective text itself must never appear in a log line.
    assert secret_objective not in line
    for forbidden in ("Bearer", "LLM_", "MODEL_API_KEY"):
        assert forbidden not in line


def test_trace_accumulates_cost_on_live_without_leaking(monkeypatch, caplog):
    monkeypatch.setenv("MODEL_API_KEY", SENTINEL_KEY)
    monkeypatch.delenv("GROUNDLINE_FORCE_MOCK", raising=False)
    monkeypatch.setattr(meta_client.httpx, "Client", _FakeClient)

    with caplog.at_level(logging.INFO, logger="groundline.analyze"):
        r = client.post("/api/analyze", json=_valid_request())

    assert r.status_code == 200
    line = "\n".join(rec.getMessage() for rec in caplog.records)
    assert "mode=live" in line
    assert "req_cost_usd=" in line and "cum_live_cost_usd=" in line
    assert "total_tok=391" in line  # from the recorded fixture
    assert SENTINEL_KEY not in line
    for forbidden in ("Bearer", "LLM_"):
        assert forbidden not in line
