"""First-party parser for SAM's box-token wire format.

SAM box tokens are facts in the hosted Responses API output_text stream. This
module parses those tokens without depending on provider parser source code.
Malformed or absent output is treated as zero parsed boxes; transport and
response completion errors remain the caller's responsibility.
"""
from __future__ import annotations

import math
import re
from dataclasses import dataclass


_BOX_TOKEN = re.compile(r"<\|box;([^|]*)\|>")
_ORDINAL_SUFFIX = re.compile(r"(?:<0f>|\|>|,)\s*(\d+)\s*$")
_NUMBER = re.compile(r"^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$")


@dataclass(frozen=True)
class SamBox:
    """A SAM box in the pixel space named by its token's w and h fields."""

    ordinal: int
    x1: float
    y1: float
    x2: float
    y2: float
    width: int
    height: int
    confidence: float | None = None


@dataclass(frozen=True)
class FractionalRegion:
    """A box expressed as fractions of the source image dimensions."""

    x: float
    y: float
    width: float
    height: float


def _fields(token: str) -> dict[str, str] | None:
    result: dict[str, str] = {}
    for entry in token.split(";"):
        if "=" not in entry:
            return None
        key, value = entry.split("=", 1)
        if not key or not value or key in result:
            return None
        result[key] = value
    return result


def _number(fields: dict[str, str], name: str) -> float | None:
    value = fields.get(name)
    if value is None or not _NUMBER.fullmatch(value):
        return None
    try:
        number = float(value)
    except (ValueError, OverflowError):
        return None
    return number if math.isfinite(number) else None


def parse_output_text(output_text: object) -> list[SamBox]:
    """Parse well-formed box records in order; ignore malformed/absent output.

    Coordinates are clamped to the dimensions embedded in each SAM token.
    Degenerate boxes after clamping are skipped because they do not describe a
    visible region. This function deliberately never raises for provider text.
    """
    if not isinstance(output_text, str) or not output_text:
        return []
    boxes: list[SamBox] = []
    for match in _BOX_TOKEN.finditer(output_text):
        ordinal_match = _ORDINAL_SUFFIX.search(output_text[:match.start()])
        if ordinal_match is None:
            continue
        fields = _fields(match.group(1))
        if fields is None:
            continue
        coords = tuple(_number(fields, key) for key in ("x1", "y1", "x2", "y2"))
        raw_width, raw_height = _number(fields, "w"), _number(fields, "h")
        if any(value is None for value in coords) or raw_width is None or raw_height is None:
            continue
        if (
            raw_width <= 0 or raw_height <= 0
            or raw_width > 2**31 - 1 or raw_height > 2**31 - 1
            or not raw_width.is_integer() or not raw_height.is_integer()
        ):
            continue
        width, height = int(raw_width), int(raw_height)
        x1, y1, x2, y2 = (float(value) for value in coords)
        # SAM's x2/y2 are inclusive pixel indices (the existing SAM mask
        # records use the same convention), so the last valid index is size-1.
        x1, x2 = min(float(width - 1), max(0.0, x1)), min(float(width - 1), max(0.0, x2))
        y1, y2 = min(float(height - 1), max(0.0, y1)), min(float(height - 1), max(0.0, y2))
        if x2 < x1 or y2 < y1:
            continue
        confidence = _number(fields, "c") if "c" in fields else None
        boxes.append(SamBox(
            ordinal=int(ordinal_match.group(1)), x1=x1, y1=y1, x2=x2, y2=y2,
            width=width, height=height, confidence=confidence,
        ))
    return boxes


def to_image_fractions(box: SamBox) -> FractionalRegion:
    """Convert a parsed SAM pixel box to normalized source-image fractions."""
    return FractionalRegion(
        x=box.x1 / box.width,
        y=box.y1 / box.height,
        width=(box.x2 - box.x1 + 1) / box.width,
        height=(box.y2 - box.y1 + 1) / box.height,
    )
