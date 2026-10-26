from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_healthz_returns_ok():
    response = client.get("/healthz")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["mode"] in ("live", "MOCK")


def test_healthz_never_leaks_credentials():
    response = client.get("/healthz")
    text = response.text
    for forbidden in ("MODEL_API_KEY", "LLM_", "Bearer"):
        assert forbidden not in text
