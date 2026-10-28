"""Offline tests for crop-relative Spark field positions and honest fallbacks."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app import field_localizer, sam_client
from app.model_types import ModelResult, Usage

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures"


def fixture_crop():
    image_data = (FIXTURES / "synthetic_product_label.png").read_bytes()
    image = sam_client.validate_image(image_data, "image/png")
    label = sam_client.GroundObject(
        object_id="0", label="white rectangle", x=140 / 1200, y=110 / 820,
        width=920 / 1200, height=599 / 820, mask_path=None, mask_width=None,
        mask_height=None, mask_bounds=None, score=0.5460992455482483,
    )
    return image, field_localizer.crop_label(image, label)


def test_crop_is_the_exact_recorded_sam_label_region():
    _, crop = fixture_crop()
    fixture = field_localizer.mock_fixture_for(crop)
    assert fixture is not None
    assert crop.image.width == 920 and crop.image.height == 599
    assert crop.left == 140 and crop.top == 110
    assert crop.image.sha256 == "6ec6e35bbf7d7524db06720648cc3ea659fceab4fc5eaf787968ac3281bc532c"


def test_model_number_position_maps_from_crop_to_original_fractional_space():
    _, crop = fixture_crop()
    fixture = field_localizer.mock_fixture_for(crop)
    assert fixture is not None
    text = fixture["response"]["output"][0]["content"][0]["text"]
    result = ModelResult(text, "muse-spark-1.3", Usage(0, 0, 0, 0), 0, "MOCK", "completed")
    parsed = field_localizer.parse_position(text, result, crop)
    assert parsed.status == "found" and parsed.field is not None
    assert parsed.field.field_name == "model number"
    assert parsed.field.value == "NSL-2048"
    assert parsed.field.confidence == pytest.approx(0.94)
    assert parsed.field.x == pytest.approx(205 / 1200)
    assert parsed.field.y == pytest.approx(360 / 820)
    assert parsed.field.width == pytest.approx(347 / 1200)
    assert parsed.field.height == pytest.approx(40 / 820)


def test_explicit_missing_position_returns_no_position_without_geometry():
    _, crop = fixture_crop()
    result = ModelResult("", "muse-spark-1.3", Usage(0, 0, 0, 0), 0, "MOCK", "completed")
    parsed = field_localizer.parse_position(
        json.dumps({"field_name": "model number", "value": None, "position": None, "confidence": None}),
        result,
        crop,
    )
    assert parsed.status == "no_position"
    assert parsed.field is None


@pytest.mark.parametrize(
    "position",
    [
        {"x": 0.9, "y": 0.2, "width": 0.2, "height": 0.1},
        {"x": -0.1, "y": 0.2, "width": 0.2, "height": 0.1},
        {"x": 0.1, "y": 0.2, "width": 0, "height": 0.1},
    ],
)
def test_invalid_or_out_of_crop_position_is_rejected(position):
    _, crop = fixture_crop()
    result = ModelResult("", "muse-spark-1.3", Usage(0, 0, 0, 0), 0, "MOCK", "completed")
    with pytest.raises(field_localizer.FieldLocalizationError):
        field_localizer.parse_position(
            json.dumps({"field_name": "model number", "value": "x", "position": position, "confidence": 0.5}),
            result,
            crop,
        )
