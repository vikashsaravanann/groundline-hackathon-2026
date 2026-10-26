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
    # The public schema is locked to liveness only: status + version. Nothing
    # that discloses the key's value or whether a key is configured.
    body = client.get("/healthz").json()
    assert set(body.keys()) == {"status", "version"}
    assert "meta_key_present" not in body
    assert "mode" not in body
    assert isinstance(body["version"], str) and body["version"]


def test_healthz_never_leaks_credentials():
    text = client.get("/healthz").text
    for forbidden in ("MODEL_API_KEY", "LLM_", "Bearer"):
        assert forbidden not in text


def test_response_identical_whether_or_not_key_present(monkeypatch):
    # Presence or absence of a configured key must not change the public
    # response at all — otherwise the endpoint would leak key availability.
    monkeypatch.delenv("MODEL_API_KEY", raising=False)
    without_key = client.get("/healthz").json()

    monkeypatch.setenv("MODEL_API_KEY", SENTINEL_SECRET)
    with_key = client.get("/healthz").json()

    assert without_key == with_key == {"status": "ok", "version": app.version}


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
