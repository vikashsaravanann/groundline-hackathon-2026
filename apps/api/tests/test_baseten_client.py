"""Deterministic Baseten adapter tests; every HTTP client is a local fake."""
import json
import socket

import httpx
import pytest

from app import baseten_client, meta_client, provider_router
from app.model_types import Capability, ProviderConfigurationError, ProviderResponseError, ProviderTransportError

SENTINEL = "BASETEN_TEST_SENTINEL_DO_NOT_DISCLOSE"


class FakeResponse:
    def __init__(self, status_code=200, body=None, *, json_error=None):
        self.status_code = status_code
        self.body = body
        self.json_error = json_error

    def json(self):
        if self.json_error:
            raise self.json_error
        return self.body


def test_baseten_model_endpoint_and_payload_contract():
    client = baseten_client.BasetenClient()
    assert client.base_url == "https://inference.baseten.co/v1"
    assert client.path == "/chat/completions"
    assert client.model_id == "meta-models/muse-spark-open-1026"
    assert client.key_env == "BASETEN_API_KEY"
    payload = client.build_payload(
        prompt="Extract the visible facts from this synthetic product label.",
        image_data_url="data:image/png;base64,c3ludGhldGlj",
    )
    assert payload == {
        "model": "meta-models/muse-spark-open-1026",
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": "Extract the visible facts from this synthetic product label."},
                {"type": "image_url", "image_url": {"url": "data:image/png;base64,c3ludGhldGlj"}},
            ],
        }],
        "max_tokens": 4096,
    }


def test_baseten_parses_completion_usage_id_and_unknown_cost():
    body = baseten_client.BasetenClient().load_fixture()
    result = baseten_client.parse_response(body, elapsed_ms=7, mode="MOCK")
    assert result.response_id == "chatcmpl-groundline-synthetic-fixture"
    assert result.model == "meta-models/muse-spark-open-1026"
    assert result.status == "completed"
    assert json.loads(result.text)["facts"]
    assert result.usage.input_tokens == 846
    assert result.usage.output_tokens == 115
    assert result.usage.total_tokens == 961
    assert result.usage.estimated_cost_usd is None


@pytest.mark.parametrize("body", [None, {}, {"choices": []}, {"choices": [None]}])
def test_baseten_rejects_missing_or_malformed_choices(body):
    with pytest.raises(ProviderResponseError):
        baseten_client.parse_response(body, elapsed_ms=0, mode="live")


@pytest.mark.parametrize("choice", [
    {"finish_reason": "stop", "message": {"content": ""}},
    {"finish_reason": "length", "message": {"content": "{}"}},
    {"finish_reason": "content_filter", "message": {"content": "{}"}},
    {"finish_reason": "stop", "message": {"content": "not-json"}},
    {"finish_reason": "stop", "message": {"content": "[]"}},
    {"message": {"content": "{}"}},
])
def test_baseten_rejects_empty_truncated_invalid_or_unexpected_output(choice):
    with pytest.raises(ProviderResponseError):
        baseten_client.parse_response({"choices": [choice]}, elapsed_ms=0, mode="live")


def test_baseten_handles_incomplete_usage_without_inventing_cost():
    body = {
        "id": "chatcmpl-synthetic-partial-usage",
        "model": baseten_client.MODEL_ID,
        "choices": [{"message": {"content": '{"facts":[]}'}, "finish_reason": "stop"}],
        "usage": {"prompt_tokens": 9},
    }
    usage = baseten_client.parse_response(body, elapsed_ms=0, mode="MOCK").usage
    assert usage.input_tokens == 9
    assert usage.output_tokens == 0
    assert usage.total_tokens == 9
    assert usage.complete is False
    assert usage.estimated_cost_usd is None


def test_baseten_bearer_header_and_mocked_transport_never_open_socket(monkeypatch):
    monkeypatch.setenv("BASETEN_API_KEY", SENTINEL)
    seen = {}

    class FakeClient:
        def __init__(self, *args, **kwargs):
            seen["base_url"] = kwargs["base_url"]
        def __enter__(self): return self
        def __exit__(self, *exc): return False
        def post(self, path, json=None, headers=None):
            seen.update(path=path, json=json, headers=headers)
            return FakeResponse(200, baseten_client.BasetenClient().load_fixture())

    def no_socket(*args, **kwargs):
        raise AssertionError("unit test attempted a real socket")

    monkeypatch.setattr(baseten_client.httpx, "Client", FakeClient)
    monkeypatch.setattr(socket.socket, "connect", no_socket)
    result = baseten_client.BasetenClient().complete_live(
        prompt="Extract the visible facts.",
        image_data_url="data:image/png;base64,c3ludGhldGlj",
    )
    assert seen["headers"]["Authorization"] == f"Bearer {SENTINEL}"
    assert seen["base_url"] == baseten_client.BASE_URL
    assert seen["path"] == baseten_client.CHAT_COMPLETIONS_PATH
    assert seen["json"]["max_tokens"] == 4096
    assert SENTINEL not in result.text


@pytest.mark.parametrize("status", [400, 401, 403, 429, 500])
def test_baseten_non_success_http_status_is_safe_and_not_retried(monkeypatch, status):
    monkeypatch.setenv("BASETEN_API_KEY", SENTINEL)
    calls = []

    class FakeClient:
        def __init__(self, *args, **kwargs): pass
        def __enter__(self): return self
        def __exit__(self, *exc): return False
        def post(self, *args, **kwargs):
            calls.append(1)
            return FakeResponse(status, {"error": SENTINEL})

    monkeypatch.setattr(baseten_client.httpx, "Client", FakeClient)
    with pytest.raises(ProviderTransportError) as err:
        baseten_client.BasetenClient().complete_live(prompt="safe")
    assert len(calls) == 1
    assert SENTINEL not in str(err.value)


def test_baseten_timeout_and_network_failures_are_classified(monkeypatch):
    monkeypatch.setenv("BASETEN_API_KEY", SENTINEL)

    class TimeoutClient:
        def __init__(self, *args, **kwargs): pass
        def __enter__(self): return self
        def __exit__(self, *exc): return False
        def post(self, *args, **kwargs): raise httpx.ReadTimeout("private request details")

    monkeypatch.setattr(baseten_client.httpx, "Client", TimeoutClient)
    with pytest.raises(ProviderTransportError, match="timed out") as err:
        baseten_client.BasetenClient().complete_live(prompt="safe")
    assert "private request details" not in str(err.value)

    class NetworkClient(TimeoutClient):
        def post(self, *args, **kwargs): raise httpx.ConnectError("private network details")

    monkeypatch.setattr(baseten_client.httpx, "Client", NetworkClient)
    with pytest.raises(ProviderTransportError, match="network failure") as err:
        baseten_client.BasetenClient().complete_live(prompt="safe")
    assert "private network details" not in str(err.value)


def test_baseten_invalid_http_json_is_a_response_error(monkeypatch):
    monkeypatch.setenv("BASETEN_API_KEY", SENTINEL)

    class FakeClient:
        def __init__(self, *args, **kwargs): pass
        def __enter__(self): return self
        def __exit__(self, *exc): return False
        def post(self, *args, **kwargs):
            return FakeResponse(200, json_error=ValueError("credential-like upstream detail"))

    monkeypatch.setattr(baseten_client.httpx, "Client", FakeClient)
    with pytest.raises(ProviderResponseError) as err:
        baseten_client.BasetenClient().complete_live(prompt="safe")
    assert SENTINEL not in str(err.value)
    assert "credential-like" not in str(err.value)


def test_capability_routes_meta_by_default_and_baseten_only_when_explicit(monkeypatch):
    monkeypatch.delenv("GROUNDLINE_PROVIDER_IMAGE_FACT_EXTRACTION", raising=False)
    monkeypatch.delenv("GROUNDLINE_PROVIDER_GENERAL_TEXT_REASONING", raising=False)
    assert provider_router.provider_for(Capability.IMAGE_FACT_EXTRACTION).name == "meta"
    with pytest.raises(ProviderConfigurationError):
        provider_router.provider_for(Capability.GENERAL_TEXT_REASONING)
    monkeypatch.setenv("GROUNDLINE_PROVIDER_GENERAL_TEXT_REASONING", "baseten")
    assert provider_router.provider_for(Capability.GENERAL_TEXT_REASONING).name == "baseten"
    with pytest.raises(ProviderConfigurationError):
        provider_router.provider_for(Capability.FUTURE_IMAGE_GROUNDING)


def test_baseten_failure_does_not_fallback_to_meta(monkeypatch):
    monkeypatch.setenv("GROUNDLINE_PROVIDER_GENERAL_TEXT_REASONING", "baseten")
    monkeypatch.delenv("GROUNDLINE_FORCE_MOCK", raising=False)
    monkeypatch.setenv("BASETEN_API_KEY", SENTINEL)
    meta_called = []

    def meta_boom(*args, **kwargs):
        meta_called.append(True)
        raise AssertionError("router attempted provider fallback")

    class UnauthorizedClient:
        def __init__(self, *args, **kwargs): pass
        def __enter__(self): return self
        def __exit__(self, *exc): return False
        def post(self, *args, **kwargs): return FakeResponse(401, {"error": SENTINEL})

    monkeypatch.setattr(meta_client.MetaClient, "complete_live", meta_boom)
    monkeypatch.setattr(baseten_client.httpx, "Client", UnauthorizedClient)
    with pytest.raises(ProviderTransportError) as err:
        provider_router.call_model(
            capability=Capability.GENERAL_TEXT_REASONING,
            objective="No external data.",
        )
    assert meta_called == []
    assert SENTINEL not in str(err.value)
