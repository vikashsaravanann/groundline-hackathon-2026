import importlib
import socket

import pytest
from fastapi.testclient import TestClient

from app.main import app, _parse_origins

client = TestClient(app)

# A fake key value used only inside tests. It is never a real credential; the
# tests assert this exact string never appears in any response.
SENTINEL_SECRET = "sk-groundline-SENTINEL-DO-NOT-DISCLOSE-0123456789"


def test_healthz_returns_ok():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_healthz_response_schema_is_exactly_expected():
    # Public schema: status, version, mode. mode is the rule-7 MOCK/live
    # announcement; meta_key_present stays removed (it disclosed key state).
    body = client.get("/healthz").json()
    assert set(body.keys()) == {"status", "version", "mode"}
    assert "meta_key_present" not in body
    assert body["mode"] in ("live", "MOCK")
    assert isinstance(body["version"], str) and body["version"]


def test_healthz_never_leaks_credentials():
    text = client.get("/healthz").text
    for forbidden in ("MODEL_API_KEY", "LLM_", "Bearer"):
        assert forbidden not in text


def test_mode_is_mock_when_key_absent(monkeypatch):
    # Rule 7: with no key configured, the mocked path announces itself as MOCK.
    monkeypatch.delenv("MODEL_API_KEY", raising=False)
    monkeypatch.delenv("GROUNDLINE_FORCE_MOCK", raising=False)
    body = client.get("/healthz").json()
    assert body == {"status": "ok", "version": app.version, "mode": "MOCK"}


def test_mode_remains_mock_when_forced_even_if_key_is_present(monkeypatch):
    monkeypatch.setenv("MODEL_API_KEY", SENTINEL_SECRET)
    monkeypatch.setenv("GROUNDLINE_FORCE_MOCK", "1")
    body = client.get("/healthz").json()
    assert body == {"status": "ok", "version": app.version, "mode": "MOCK"}


def test_mode_is_live_when_key_present(monkeypatch):
    # With a key configured, mode flips to live — the real adapter path. The
    # key value itself must still never appear in the response.
    monkeypatch.delenv("GROUNDLINE_FORCE_MOCK", raising=False)
    monkeypatch.setenv("MODEL_API_KEY", SENTINEL_SECRET)
    body = client.get("/healthz").json()
    assert body == {"status": "ok", "version": app.version, "mode": "live"}


def test_injected_sentinel_secret_is_never_disclosed(monkeypatch):
    # Even with a key configured, the key value must not appear anywhere in the
    # response body or headers.
    monkeypatch.setenv("MODEL_API_KEY", SENTINEL_SECRET)
    response = client.get("/healthz")
    assert SENTINEL_SECRET not in response.text
    assert SENTINEL_SECRET not in str(dict(response.headers))


def test_healthz_makes_no_outbound_network_call(monkeypatch):
    # Any real outbound connection would go through socket.connect. The ASGI
    # TestClient runs in-process, so blocking connect must not affect /healthz;
    # a 200 proves the endpoint performed no chargeable upstream call.
    def _blocked(*args, **kwargs):
        raise AssertionError("/healthz attempted an outbound network connection")

    monkeypatch.setattr(socket.socket, "connect", _blocked)
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_unknown_route_is_handled_safely():
    # Errors must be safe: an unknown path is a clean 404, not a 500, and leaks
    # no credential markers.
    response = client.get("/no-such-route")
    assert response.status_code == 404
    for forbidden in ("MODEL_API_KEY", "LLM_", "Bearer"):
        assert forbidden not in response.text


def test_cors_allows_approved_origin():
    approved = "http://localhost:3000"
    response = client.get("/healthz", headers={"Origin": approved})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == approved


def test_cors_rejects_unapproved_origin():
    response = client.get("/healthz", headers={"Origin": "http://evil.example"})
    # The browser contract: a disallowed origin gets no allow-origin echo.
    assert response.headers.get("access-control-allow-origin") != "http://evil.example"


def test_cors_preflight_for_approved_origin():
    approved = "http://localhost:3000"
    response = client.options(
        "/healthz",
        headers={
            "Origin": approved,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert response.headers.get("access-control-allow-origin") == approved
    assert "POST" in response.headers.get("access-control-allow-methods", "")
    assert "content-type" in response.headers.get("access-control-allow-headers", "").lower()


def test_cors_preflight_rejects_unapproved_origin():
    response = client.options(
        "/api/analyze",
        headers={
            "Origin": "https://unapproved.example",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.headers.get("access-control-allow-origin") != "https://unapproved.example"


@pytest.mark.parametrize(
    "raw,expected",
    [
        (" http://localhost:3000 ", ["http://localhost:3000"]),
        (",, http://a.test ,", ["http://a.test"]),
        ("http://a.test, http://a.test", ["http://a.test"]),
        ("http://a.test,http://b.test", ["http://a.test", "http://b.test"]),
        ("", []),
    ],
)
def test_parse_origins_rejects_malformed_input(raw, expected):
    # Malformed values must not inject blank origins or duplicates.
    assert _parse_origins(raw) == expected


@pytest.mark.parametrize(
    "raw", ["*", "https://example.com/", "https://example.com/path", "https://example.com?x=1"]
)
def test_parse_origins_rejects_wildcard_or_non_origin_values(raw):
    with pytest.raises(ValueError):
        _parse_origins(raw)


def test_backend_imports_cleanly():
    # Import integrity: the app module imports without side effects and exposes
    # the expected FastAPI application metadata.
    module = importlib.import_module("app.main")
    assert module.app.title == "Groundline API"
    assert module.app.version == "0.1.0"


def test_app_startup_and_shutdown_lifespan():
    # Startup check: entering the TestClient context runs the ASGI lifespan
    # (startup + shutdown) without error, which a bare uvicorn boot would hit.
    with TestClient(app) as started:
        assert started.get("/healthz").status_code == 200
