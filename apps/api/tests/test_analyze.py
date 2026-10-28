"""Offline tests for the Meta Model adapter and the /api/analyze endpoint.

No test makes a network call. The live path is exercised with a fake httpx
client that replays the recorded fixture, so the credential-leak and payload
assertions run without spending a token.
"""
import base64
import json
import logging
import socket
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import baseten_client, main, meta_client, provider_router
from app.main import app
from app.model_types import Capability, ProviderConfigurationError, ProviderResponseError, ProviderTransportError

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


def test_parser_reads_recorded_multimodal_image_fixture():
    # Sanitized authentic response from a later synthetic image call; the
    # original GL-DEMO-2048 response is documented but its raw body was absent.
    body = meta_client._load_fixture(meta_client.IMAGE_FIXTURE)
    result = meta_client.parse_response(body, elapsed_ms=0, mode="MOCK")
    assert result.status == "completed"
    assert result.model == "muse-spark-1.3"
    assert result.response_id == "resp_sanitized_synthetic_image_fixture"
    assert body["reasoning"]["effort"] == "low"
    assert body["store"] is False
    facts = json.loads(result.text)["facts"]
    assert {fact["label"]: fact["value"] for fact in facts}["MODEL"] == "NSL-2048"
    assert result.usage.input_tokens == 1314
    assert result.usage.output_tokens == 395
    assert result.usage.total_tokens == 1709


def test_baseten_synthetic_fixture_parses_openai_response_shape():
    body = baseten_client.BasetenClient().load_fixture()
    result = baseten_client.parse_response(body, elapsed_ms=0, mode="MOCK")
    assert result.model == "meta-models/muse-spark-open-1026"
    assert result.response_id == "chatcmpl-groundline-synthetic-fixture"
    assert result.usage.input_tokens == 846
    assert result.usage.output_tokens == 115
    assert result.usage.total_tokens == 961
    assert result.usage.estimated_cost_usd is None
    facts = json.loads(result.text)["facts"]
    assert {fact["label"]: fact["value"] for fact in facts}["MODEL"] == "NSL-2048"


def test_baseten_fixture_is_only_available_when_capability_is_explicitly_routed(monkeypatch):
    monkeypatch.delenv("GROUNDLINE_PROVIDER_GENERAL_TEXT_REASONING", raising=False)
    with pytest.raises(ProviderConfigurationError):
        provider_router.call_model(
            capability=Capability.GENERAL_TEXT_REASONING,
            objective="Reason about this text.",
        )
    monkeypatch.setenv("GROUNDLINE_PROVIDER_GENERAL_TEXT_REASONING", "baseten")
    monkeypatch.delenv("GROUNDLINE_FORCE_MOCK", raising=False)
    monkeypatch.delenv("BASETEN_API_KEY", raising=False)
    result = provider_router.call_model(
        capability=Capability.GENERAL_TEXT_REASONING,
        image_data_url="data:image/png;base64,c3ludGhldGlj",
        objective="Reason about the visible label.",
    )
    assert result.mode == "MOCK"
    assert result.model == "meta-models/muse-spark-open-1026"
    assert result.usage.input_tokens == 846
    assert result.usage.output_tokens == 115


def test_baseten_force_mock_never_calls_network_even_with_key(monkeypatch):
    monkeypatch.setenv("GROUNDLINE_PROVIDER_GENERAL_TEXT_REASONING", "baseten")
    monkeypatch.setenv("GROUNDLINE_FORCE_MOCK", "1")
    monkeypatch.setenv("BASETEN_API_KEY", SENTINEL_KEY)

    def _boom(*args, **kwargs):
        raise AssertionError("Baseten network client constructed while FORCE_MOCK is set")

    monkeypatch.setattr(baseten_client.httpx, "Client", _boom)
    result = provider_router.call_model(
        capability=Capability.GENERAL_TEXT_REASONING,
        objective="Reason about this text.",
    )
    assert result.mode == "MOCK"
    assert result.model == "meta-models/muse-spark-open-1026"


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
        provider_router.call_model(
            capability=Capability.IMAGE_FACT_EXTRACTION,
            image_data_url="data:image/png;base64,c3ludGhldGlj",
            objective="Read this label.",
            effort="turbo",
        )


# --- validation (four rejections) -------------------------------------------


def test_rejects_empty_objective():
    r = client.post("/api/analyze", json=_valid_request(objective="   "))
    assert r.status_code == 422
    assert "objective must not be empty" in r.text


@pytest.mark.parametrize("blank", ["", "\n", "\t  \n", "     "])
def test_rejects_whitespace_or_empty_objective_variants(blank):
    # Empty and whitespace-only objectives are both rejected (H04).
    r = client.post("/api/analyze", json=_valid_request(objective=blank))
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
    assert body["usage"]["estimated_cost_usd"] == 0.0
    assert body["target_found"] is False
    assert body["target_region"] is None


def test_analyze_returns_only_recorded_sam_region_for_exact_source_image(monkeypatch):
    monkeypatch.delenv("MODEL_API_KEY", raising=False)
    monkeypatch.setenv("GROUNDLINE_FORCE_MOCK", "1")
    raw = (Path(__file__).resolve().parent.parent / "fixtures" / "synthetic_product_label.png").read_bytes()
    request = _valid_request(
        image_base64=base64.b64encode(raw).decode("ascii"), mime_type="image/png"
    )
    response = client.post("/api/analyze", json=request)
    assert response.status_code == 200
    body = response.json()
    assert body["target_found"] is True
    assert body["target_phrase"] == "white rectangle"
    region = body["target_region"]
    assert region["x"] == pytest.approx(140 / 1200)
    assert region["y"] == pytest.approx(110 / 820)
    assert region["width"] == pytest.approx((1059 - 140 + 1) / 1200)
    assert region["height"] == pytest.approx((708 - 110 + 1) / 820)


def test_analyze_never_invents_region_for_unmatched_image(monkeypatch):
    monkeypatch.delenv("MODEL_API_KEY", raising=False)
    monkeypatch.setenv("GROUNDLINE_FORCE_MOCK", "1")
    response = client.post("/api/analyze", json=_valid_request())
    assert response.status_code == 200
    assert response.json()["target_found"] is False
    assert response.json()["target_region"] is None
    assert response.json()["target_phrase"] is None


@pytest.mark.parametrize(
    ("objective", "expected_code", "expected_copy"),
    [
        (
            "Interpret this medical document",
            "OUT_OF_SCOPE_MEDICAL",
            "cannot interpret medical documents",
        ),
        (
            "Give me electrical wiring repair guidance",
            "OUT_OF_SCOPE_ELECTRICAL_REPAIR",
            "cannot provide electrical wiring repair guidance",
        ),
    ],
)
def test_out_of_scope_requests_return_designed_refusal_without_provider_call(
    monkeypatch, objective, expected_code, expected_copy
):
    monkeypatch.setenv("GROUNDLINE_FORCE_MOCK", "0")
    monkeypatch.setenv("MODEL_API_KEY", SENTINEL_KEY)

    def provider_must_not_run(**kwargs):
        raise AssertionError("out-of-scope request reached the model provider")

    monkeypatch.setattr(provider_router, "call_model", provider_must_not_run)
    response = client.post("/api/analyze", json=_valid_request(objective=objective))

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "refused"
    assert body["mode"] == "UNAVAILABLE"
    assert body["model"] == "none"
    assert body["facts"] == []
    assert body["usage"]["estimated_cost_usd"] == 0
    assert expected_copy in body["refusal_message"].lower()
    assert "not sent to an AI provider" in body["refusal_message"]


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
        self.args = args
        self.kwargs = kwargs

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def post(self, path, json=None, headers=None):
        _FakeClient.captured = {
            "path": path, "json": json, "headers": headers,
            "base_url": self.kwargs.get("base_url"),
        }
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
    assert sent["max_output_tokens"] == meta_client.DEFAULT_MAX_OUTPUT_TOKENS
    assert sent["input"][0]["role"] == "user"
    assert [part["type"] for part in sent["input"][0]["content"]] == [
        "input_text", "input_image"
    ]
    assert sent["input"][0]["content"][1]["image_url"].startswith("data:image/png;base64,")
    # The key is sent upstream as a Bearer token (but never returned above).
    assert _FakeClient.captured["headers"]["Authorization"] == f"Bearer {SENTINEL_KEY}"


def test_baseten_multimodal_request_shape_and_bearer_header_offline(monkeypatch):
    monkeypatch.setenv("BASETEN_API_KEY", SENTINEL_KEY)
    monkeypatch.delenv("GROUNDLINE_FORCE_MOCK", raising=False)
    payload_seen = {}

    class _FakeBasetenResponse(_FakeResponse):
        def json(self):
            return baseten_client.BasetenClient().load_fixture()

    class _FakeBasetenClient:
        def __init__(self, *args, **kwargs):
            self.kwargs = kwargs
        def __enter__(self): return self
        def __exit__(self, *exc): return False
        def post(self, path, json=None, headers=None):
            payload_seen.update(path=path, json=json, headers=headers, base_url=self.kwargs["base_url"])
            return _FakeBasetenResponse(200, {})

    def _no_socket(*args, **kwargs):
        raise AssertionError("Baseten adapter attempted a real socket")

    monkeypatch.setattr(baseten_client.httpx, "Client", _FakeBasetenClient)
    monkeypatch.setattr(socket.socket, "connect", _no_socket)
    result = baseten_client.BasetenClient().complete_live(
        prompt="Extract the visible facts from this synthetic product label.",
        image_data_url="data:image/png;base64,c3ludGhldGlj",
    )
    assert result.mode == "live"
    assert result.model == "meta-models/muse-spark-open-1026"
    assert payload_seen["base_url"] == "https://inference.baseten.co/v1"
    assert payload_seen["path"] == "/chat/completions"
    assert payload_seen["headers"]["Authorization"] == f"Bearer {SENTINEL_KEY}"
    body = payload_seen["json"]
    assert body["model"] == "meta-models/muse-spark-open-1026"
    assert body["max_tokens"] == 4096
    assert body["messages"][0]["content"] == [
        {"type": "text", "text": "Extract the visible facts from this synthetic product label."},
        {
        "type": "image_url",
        "image_url": {"url": "data:image/png;base64,c3ludGhldGlj"},
        },
    ]
    assert SENTINEL_KEY not in result.text


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
        provider_router.call_model(
            capability=Capability.IMAGE_FACT_EXTRACTION,
            image_data_url="data:image/png;base64,c3ludGhldGlj",
            objective="Read this label.",
        )
    assert SENTINEL_KEY not in str(excinfo.value)
    assert "Bearer" not in str(excinfo.value)


# --- request tracing --------------------------------------------------------


def test_trace_logs_length_not_objective_and_sets_correlation_id(monkeypatch, caplog):
    monkeypatch.delenv("MODEL_API_KEY", raising=False)
    monkeypatch.setenv("GROUNDLINE_FORCE_MOCK", "1")
    secret_objective = "SECRET-OBJECTIVE-TEXT-must-not-be-logged-verbatim"
    cumulative_before = main._cumulative_live_cost_usd

    with caplog.at_level(logging.INFO, logger="groundline.analyze"):
        r = client.post(
            "/api/analyze",
            json=_valid_request(objective=secret_objective),
            headers={"Origin": "http://localhost:3000"},
        )

    assert r.status_code == 200
    assert r.headers.get("X-Correlation-ID")  # correlation id returned
    exposed_headers = {
        header.strip().lower()
        for header in r.headers.get("access-control-expose-headers", "").split(",")
    }
    assert "x-correlation-id" in exposed_headers

    line = "\n".join(rec.getMessage() for rec in caplog.records)
    assert "analyze cid=" in line
    assert "mode=MOCK" in line
    assert "req_cost_usd=0.000000" in line
    assert f"cum_live_cost_usd={cumulative_before:.6f}" in line
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
