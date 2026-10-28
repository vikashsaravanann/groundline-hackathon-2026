"""First-party SAM box parser tests; fixtures are local and no calls are made."""
from pathlib import Path

import pytest

from app import sam_parser

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures"


def raw_fixture(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")


def test_parses_authentic_prompt_a_single_box_in_sam_order():
    boxes = sam_parser.parse_output_text(
        raw_fixture("sam31_prompt_white_rectangle.raw.txt")
    )
    assert len(boxes) == 1
    box = boxes[0]
    assert (box.ordinal, box.x1, box.y1, box.x2, box.y2) == (0, 140, 110, 1059, 708)
    assert (box.width, box.height) == (1200, 820)
    assert box.confidence == pytest.approx(0.5460992455482483)


def test_parses_multiple_boxes_and_preserves_provider_order():
    output = (
        "<0f>3<|box;x1=10;y1=20;x2=30;y2=40;w=100;h=80|>"
        "2<|box;x1=50;y1=25;x2=90;y2=75;w=100;h=80|>"
    )
    boxes = sam_parser.parse_output_text(output)
    assert [box.ordinal for box in boxes] == [3, 2]
    assert [(box.x1, box.y1, box.x2, box.y2) for box in boxes] == [
        (10, 20, 30, 40), (50, 25, 90, 75)
    ]


def test_empty_recorded_prompt_a_output_is_zero_matches():
    assert raw_fixture("sam31_prompt_model_number_label.raw.txt") == ""
    assert sam_parser.parse_output_text("") == []
    assert sam_parser.parse_output_text(None) == []


def test_malformed_tokens_are_ignored_without_raising():
    output = (
        "<0f>0<|box;x1=bad;y1=2;x2=20;y2=20;w=100;h=100|>"
        "1<|box;x1=1;y1=2;x2=3;w=100;h=100|>"
    )
    assert sam_parser.parse_output_text(output) == []


def test_out_of_bounds_coordinates_are_clamped_before_fraction_conversion():
    boxes = sam_parser.parse_output_text(
        "<0f>0<|box;x1=-10;y1=5;x2=120;y2=90;w=100;h=80|>"
    )
    assert len(boxes) == 1
    box = boxes[0]
    assert (box.x1, box.y1, box.x2, box.y2) == (0, 5, 99, 79)
    region = sam_parser.to_image_fractions(box)
    assert region.x == 0
    assert region.y == pytest.approx(5 / 80)
    assert region.width == 1
    assert region.height == pytest.approx(75 / 80)
