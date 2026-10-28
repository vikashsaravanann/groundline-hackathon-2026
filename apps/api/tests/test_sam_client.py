"""SAM parser and adapter tests use synthetic bytes and never call Meta."""
from __future__ import annotations

import base64
import json
from pathlib import Path

import pytest
from meta_sam_parser import _mask_codec

from app import sam_client

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures"
SENTINEL = "TEST_ONLY_SAM_SENTINEL_NOT_A_REAL_KEY"


def load_image():
    raw = (FIXTURES / "sam31_synthetic_image.png").read_bytes()
    return sam_client.validate_image(raw, "image/png")


def load_fixture():
    return json.loads((FIXTURES / "sam31_synthetic_response.json").read_text())


def test_synthetic_fixture_parses_with_official_sam_parser():
    image = load_image()
    fixture = load_fixture()
    result = pytest.importorskip("asyncio").run(
        sam_client.parse_mock_fixture(fixture, image=image, target_phrase="desk lamp")
    )
    assert fixture["provenance"] == "SYNTHETIC_OFFLINE_FIXTURE"
    assert result.model == "sam-3.1"
    assert result.image_sha256 == image.sha256
    assert result.image_width == 800 and result.image_height == 600
    assert len(result.objects) == 1
    item = result.objects[0]
    assert item.object_id == "0"
    assert item.x == pytest.approx(190 / 800)
    assert item.y == pytest.approx(105 / 600)
    assert item.width == pytest.approx(286 / 800)
    assert item.height == pytest.approx(420 / 600)
    assert item.mask_path and item.mask_width == 143 and item.mask_height == 210
    assert item.mask_bounds == {"x": 190, "y": 105, "width": 286, "height": 420}
    assert item.score is None
    assert result.estimated_cost_usd == 0


def test_fixture_is_only_selected_for_exact_source_and_prompt():
    image = load_image()
    assert sam_client.mock_fixture_for(image, "desk lamp") is not None
    assert sam_client.mock_fixture_for(image, "red bottle") is None
    changed = sam_client.ValidatedImage(
        image.data + b"x", image.mime_type, image.width, image.height, "0" * 64
    )
    assert sam_client.mock_fixture_for(changed, "desk lamp") is None


@pytest.mark.parametrize("target", ["", "  ", "lamp, box", "cat or dog", "a " * 9, "?lamp"])
def test_target_phrase_rejects_empty_lists_questions_and_long_text(target):
    with pytest.raises(sam_client.GroundingValidationError):
        sam_client.validate_target_phrase(target)


def test_image_content_and_mime_are_verified():
    with pytest.raises(sam_client.GroundingValidationError):
        sam_client.validate_image(load_image().data, "image/jpeg")
    with pytest.raises(sam_client.GroundingValidationError):
        sam_client.validate_image(b"not an image", "image/png")


def test_request_matches_hosted_sam_responses_contract():
    image = load_image()
    payload = sam_client.build_payload(image, "desk lamp")
    assert payload["model"] == "sam-3.1"
    assert payload["stream"] is True
    assert payload["metadata"] == {
        "mask_encoding": "one_bit",
        "include_confidence": "true",
    }
    assert "include_confidence" not in payload
    assert "store" not in payload
    message = payload["input"][0]
    assert message["type"] == "message" and message["role"] == "user"
    assert message["content"][0] == {"type": "input_text", "text": "desk lamp"}
    image_part = message["content"][1]
    assert image_part["type"] == "input_image"
    assert image_part["image_url"].startswith("data:image/png;base64,")
    assert base64.b64decode(image_part["image_url"].split(",", 1)[1]) == image.data


def _line_with_objects(*, boxes: list[tuple[int, int, int, int, str]], width=800, height=600):
    raster = [0] * 16
    raster[5] = raster[6] = raster[9] = raster[10] = 1
    encoded = _mask_codec._encode_raster(raster, 4, 4)
    items = []
    for object_id, (left, top, right, bottom, _label) in enumerate(boxes):
        items.append(
            f"{object_id}<|box;x1={left};y1={top};x2={right-1};y2={bottom-1};w={width};h={height};c=0.8|>"
            f"<|mask;x=0;y=0;c=0.8;data=4,4,{encoded}|>"
        )
    return "<0f>" + ",".join(items)


async def _sse_response(line: str, *, completed=True):
    lane = {"item_id": "msg_sam", "output_index": 0, "content_index": 0}
    events = []
    if line:
        events.append({"type": "response.output_text.delta", "delta": line, **lane})
    events.append({"type": "response.output_text.done", "text": line, **lane})
    if completed:
        events.append({"type": "response.completed", "response": {"id": "resp-test", "status": "completed", "model": "sam-3.1"}})
    else:
        events.append({"type": "response.incomplete", "response": {"incomplete_details": {"reason": "max_output_tokens"}}})
    for event in events:
        yield event


def test_normalizer_preserves_multiple_objects_and_null_confidence():
    image = load_image()
    line = _line_with_objects(boxes=[(10, 12, 40, 60, "lamp"), (80, 90, 130, 150, "lamp")])
    result = pytest.importorskip("asyncio").run(
        sam_client.parse_event_source(_sse_response(line), image=image, target_phrase="desk lamp")
    )
    assert len(result.objects) == 2
    assert [o.object_id for o in result.objects] == ["0", "1"]
    assert [o.score for o in result.objects] == [0.8, 0.8]


def test_empty_completed_lane_is_a_valid_no_match():
    image = load_image()
    result = pytest.importorskip("asyncio").run(
        sam_client.parse_event_source(_sse_response(""), image=image, target_phrase="rare object")
    )
    assert result.objects == ()


def test_incomplete_stream_is_rejected():
    image = load_image()
    with pytest.raises(sam_client.GroundingResponseError):
        pytest.importorskip("asyncio").run(
            sam_client.parse_event_source(
                _sse_response(_line_with_objects(boxes=[(10, 12, 40, 60, "lamp")]), completed=False),
                image=image,
                target_phrase="desk lamp",
            )
        )


class FakeStreamResponse:
    status_code = 200

    def __init__(self, events):
        self.events = events

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def aiter_lines(self):
        for event in self.events:
            yield "data: " + json.dumps(event)


def test_live_adapter_uses_one_authenticated_sam_request_and_never_leaks_key(monkeypatch):
    image = load_image()
    line = _line_with_objects(boxes=[(190, 105, 476, 525, "lamp")])
    events = list(pytest.importorskip("asyncio").run(_collect(_sse_response(line))))
    captured = {}

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            captured["client_kwargs"] = kwargs

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        def stream(self, method, path, *, json, headers):
            captured.update(method=method, path=path, payload=json, headers=headers)
            return FakeStreamResponse(events)

    monkeypatch.setattr(sam_client.httpx, "AsyncClient", FakeAsyncClient)
    result = pytest.importorskip("asyncio").run(
        sam_client.complete_live(image=image, target_phrase="desk lamp", api_key=SENTINEL)
    )
    assert captured["method"] == "POST" and captured["path"] == "/responses"
    assert captured["client_kwargs"]["base_url"] == "https://api.meta.ai/v1"
    assert captured["payload"]["model"] == "sam-3.1"
    assert captured["payload"]["stream"] is True
    assert captured["payload"]["metadata"] == {
        "mask_encoding": "one_bit",
        "include_confidence": "true",
    }
    assert captured["headers"]["Authorization"] == f"Bearer {SENTINEL}"
    assert result.model == "sam-3.1" and result.objects
    assert result.response_id == "resp-test"
    assert SENTINEL not in repr(result)


def test_live_adapter_retries_only_one_pre_connection_failure(monkeypatch):
    image = load_image()
    line = _line_with_objects(boxes=[(190, 105, 476, 525, "lamp")])
    events = list(pytest.importorskip("asyncio").run(_collect(_sse_response(line))))
    attempts = {"count": 0}

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            attempts["count"] += 1
            if attempts["count"] == 1:
                raise sam_client.httpx.ConnectError(
                    "connect failed", request=sam_client.httpx.Request("POST", sam_client.BASE_URL + sam_client.PATH)
                )
            return self

        async def __aexit__(self, *exc):
            return False

        def stream(self, *args, **kwargs):
            return FakeStreamResponse(events)

    monkeypatch.setattr(sam_client.httpx, "AsyncClient", FakeAsyncClient)
    result = pytest.importorskip("asyncio").run(
        sam_client.complete_live(image=image, target_phrase="desk lamp", api_key=SENTINEL)
    )
    assert attempts["count"] == 2
    assert result.objects


def test_live_adapter_can_be_configured_for_one_attempt(monkeypatch):
    image = load_image()
    attempts = {"count": 0}

    class ConnectFailureClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            attempts["count"] += 1
            raise sam_client.httpx.ConnectError(
                "connect failed", request=sam_client.httpx.Request("POST", sam_client.BASE_URL + sam_client.PATH)
            )

        async def __aexit__(self, *exc):
            return False

    monkeypatch.setattr(sam_client.httpx, "AsyncClient", ConnectFailureClient)
    with pytest.raises(sam_client.GroundingTransportError):
        pytest.importorskip("asyncio").run(
            sam_client.complete_live(
                image=image, target_phrase="desk lamp", api_key=SENTINEL,
                max_attempts=1,
            )
        )
    assert attempts["count"] == 1


def test_live_adapter_times_out_without_retrying_uncertain_completion(monkeypatch):
    import asyncio

    image = load_image()
    attempts = {"count": 0}

    class SlowAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            attempts["count"] += 1
            await asyncio.sleep(0.02)
            return self

        async def __aexit__(self, *exc):
            return False

    monkeypatch.setattr(sam_client.httpx, "AsyncClient", SlowAsyncClient)
    with pytest.raises(sam_client.GroundingTimeoutError, match="not retried"):
        asyncio.run(
            sam_client.complete_live(
                image=image, target_phrase="desk lamp", api_key=SENTINEL, timeout=0.001
            )
        )
    assert attempts["count"] == 1


async def _collect(iterator):
    return [item async for item in iterator]
