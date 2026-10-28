"""Generate five synthetic, offline-only SAM robustness images and response fixtures.

The response tokens are test inputs, not provider observations or model results.
Run from the repository root with apps/api/.venv/bin/python.
"""
from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter
from meta_sam_parser import _mask_codec

ROOT = Path(__file__).resolve().parent / "adversarial"
ROOT.mkdir(parents=True, exist_ok=True)
W, H = 640, 420
BACKGROUND = (240, 245, 250)
# Tiny, deterministic test mask. This is synthetic wire-format data, not a
# model prediction. A coarse filled raster lets the offline path exercise the
# same box-plus-mask record structure as the hosted response parser.
MASK_DATA = _mask_codec._encode_raster([1] * 16, 4, 4)


def label(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], model: str) -> None:
    x1, y1, x2, y2 = box
    draw.rounded_rectangle(box, radius=12, fill="white", outline=(35, 54, 78), width=4)
    draw.text((x1 + 20, y1 + 18), "SYNTHETIC SAMPLE", fill=(35, 54, 78))
    draw.text((x1 + 20, y1 + 58), f"MODEL: {model}", fill=(12, 20, 35))
    draw.text((x1 + 20, y1 + 100), "12 V · MOCK ONLY", fill=(50, 65, 82))


def save(name: str, image: Image.Image, boxes: list[tuple[int, int, int, int]], outcome: str, note: str) -> None:
    path = ROOT / f"{name}.png"
    image.save(path, format="PNG", optimize=True)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    tokens = []
    for ordinal, (x1, y1, x2, y2) in enumerate(boxes):
        tokens.append(
            f"{ordinal}<|box;x1={x1};y1={y1};x2={x2};y2={y2};w={W};h={H}|>"
            f"<|mask;x=0;y=0;data=4,4,{MASK_DATA}|>"
        )
    raw = "<0f>" + "".join(tokens) if tokens else ""
    fixture = {
        "provenance": "SYNTHETIC_OFFLINE_FIXTURE",
        "model_response": False,
        "case": name,
        "description": note,
        "mime_type": "image/png",
        "image_width": W,
        "image_height": H,
        "image_sha256": digest,
        "target_phrase": "white rectangle",
        "expected_pipeline_outcome": outcome,
        "output_text": raw,
    }
    (ROOT / f"{name}.json").write_text(json.dumps(fixture, indent=2) + "\n", encoding="utf-8")


# 1. Blur destroys small printed text; expected fixture result is no region.
blurred = Image.new("RGB", (W, H), BACKGROUND)
d = ImageDraw.Draw(blurred)
label(d, (150, 125, 490, 295), "BLUR-101")
blurred = blurred.filter(ImageFilter.GaussianBlur(radius=8))
save("blurred_label", blurred, [], "no_match", "A heavily blurred label. Empty output tests honest no-match handling.")

# 2. Two visually similar labels; both boxes are returned, never select one by default.
two = Image.new("RGB", (W, H), BACKGROUND)
d = ImageDraw.Draw(two)
label(d, (35, 125, 285, 300), "TWIN-101")
label(d, (355, 125, 605, 300), "TWIN-102")
save("two_similar_labels", two, [(33, 123, 286, 301), (354, 123, 606, 301)], "multiple_candidates", "Two similar labels. Both candidates are returned and selection remains with the user.")

# 3. A tilted label; the box encloses the visible rotated source region.
rotated = Image.new("RGB", (W, H), BACKGROUND)
d = ImageDraw.Draw(rotated)
label(d, (180, 125, 460, 295), "TURN-101")
rotated = rotated.rotate(22, resample=Image.Resampling.BICUBIC, expand=False, fillcolor=BACKGROUND)
# Rotation around image center; enclosing AABB of the original rectangle corners.
angle = math.radians(22)
cx, cy = W / 2, H / 2
corners = [(180, 125), (460, 125), (460, 295), (180, 295)]
rotated_points = [
    (cx + (x - cx) * math.cos(angle) - (y - cy) * math.sin(angle),
     cy + (x - cx) * math.sin(angle) + (y - cy) * math.cos(angle))
    for x, y in corners
]
x1 = max(0, math.floor(min(p[0] for p in rotated_points)))
y1 = max(0, math.floor(min(p[1] for p in rotated_points)))
x2 = min(W - 1, math.ceil(max(p[0] for p in rotated_points)) - 1)
y2 = min(H - 1, math.ceil(max(p[1] for p in rotated_points)) - 1)
save("rotated_image", rotated, [(x1, y1, x2, y2)], "one_candidate", "The entire image is rotated. The synthetic response carries the axis-aligned visible extent.")

# 4. Label crosses the left frame edge; only visible pixels are eligible geometry.
partial = Image.new("RGB", (W, H), BACKGROUND)
d = ImageDraw.Draw(partial)
label(d, (-120, 115, 220, 285), "EDGE-101")
save("partly_outside_frame", partial, [(0, 113, 221, 286)], "one_clamped_candidate", "The label is cropped by the left frame edge; response box is clipped to visible image bounds.")

# 5. Empty scene; expected output is empty.
empty = Image.new("RGB", (W, H), BACKGROUND)
d = ImageDraw.Draw(empty)
d.rectangle((35, 35, W - 35, H - 35), outline=(215, 224, 235), width=2)
save("empty_frame", empty, [], "no_match", "A blank frame without a label. Empty output tests explicit no-match handling.")
