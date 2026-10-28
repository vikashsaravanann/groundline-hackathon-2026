# Synthetic product-label fixture reference

## Image under test

- Fixture: `synthetic_product_label.png`
- Dimensions: **1200 × 820 pixels**
- Format: PNG
- SHA-256: `34a031a10d9910ea89141015600be473f3cb33933687e6e5cedc2934a202cbc4`
- Provenance: Groundline's existing fictional Northstar Labs / desk-lamp label. It contains synthetic identifiers only.

## Expected target regions (recorded before SAM testing)

Coordinates use the original image's pixel space, with `(0, 0)` at the top-left. These are visual reference estimates, not model output.

- **Model-number line** (`MODEL: NSL-2048`): approximately `x=205..550`, `y=360..398`. This is the narrow semantic target for the prompt `model number label`.
- **Whole printed rectangular product sticker**: approximately `x=138..1063`, `y=108..713`. This is the expected physical region for prompts describing the printed sticker or adhesive label.

The sticker border is rounded and dark; its interior is white with black printed text. The model-number line sits below `PRODUCT: DESK LAMP` and above `INPUT: 12 V DC`. Prompt results should be judged against these two references: finding the whole sticker is correct for a physical-sticker prompt, while a semantic model-number prompt should ideally isolate the model-number line. A box elsewhere in the image is a wrong-region match; no output boxes is a legitimate no-match.

## SAM 3.1 prompt-discovery records

All six calls used the same image and the existing adapter's `sam-3.1` Responses API payload. Each was a single user message with `input_text` plus an `input_image` PNG data URL, `stream: true`, and metadata selecting one-bit masks and confidence output. The image data is omitted from the JSON metadata sidecars. Every raw output file was written before parsing; raw special tokens and any provider-supplied whitespace are unmodified. Empty files are authentic empty `output_text` responses and represent zero matches, not parser errors.

| Prompt | HTTP / response | Boxes | Raw SAM box coordinates (pixels) | Result against reference |
|---|---|---:|---|---|
| `model number label` | 200 / completed | 0 | — | No match; did not isolate the model-number line. |
| `printed rectangular sticker` | 200 / completed | 0 | — | No match. |
| `white label with small black text` | 200 / completed | 0 | — | No match. |
| `adhesive label` | 200 / completed | 0 | — | No match. |
| `white rectangle` | 200 / completed | 1 | `x1=140, y1=110, x2=1059, y2=708` | Correct whole-sticker region; closely matches the expected `x=138..1063, y=108..713`. It does not isolate only the model-number text. A mask was returned. |
| `sticker` | 200 / completed | 0 | — | No match. |

For each prompt, `<slug>` in the filenames below identifies the prompt. The `.raw.txt` file is exactly the response's `output_text`; the `.json` sidecar records prompt, request shape (with image bytes omitted), HTTP/completion status, response ID, usage, elapsed time, parsed box coordinates, and the raw-before-parse flag.

- `sam31_prompt_model_number_label.raw.txt` / `.json`
- `sam31_prompt_printed_rectangular_sticker.raw.txt` / `.json`
- `sam31_prompt_white_label_small_black_text.raw.txt` / `.json`
- `sam31_prompt_adhesive_label.raw.txt` / `.json`
- `sam31_prompt_white_rectangle.raw.txt` / `.json`
- `sam31_prompt_sticker.raw.txt` / `.json`

All six responses reported `images_processed: 1` and zero input/output text tokens. The adapter estimates **$0.0025 per image** from Meta's published SAM image rate of $2.50 per 1,000 images, or about $0.015 for these six calls; this is an estimate, not invoice/billing evidence. The API response did not report a dollar charge. See [Meta SAM 3.1 pricing](https://dev.meta.ai/models/sam-3-1).

### Finding

SAM 3.1 did locate the physical label when prompted with the concise visual phrase `white rectangle`; the returned box and mask identify the whole sticker, not the small `MODEL: NSL-2048` text line itself. The four requested semantic/material descriptions plus the concise noun `sticker` returned legitimate zero-match outputs. This demonstrates reachability and one successful region match on this fixture, but it does not yet establish reliable OCR-line segmentation. No UI work or additional live calls were performed.

## Two-stage label-to-field grounding fixtures — 28 October 2026

The `/api/ground` two-stage path uses the authentic `white rectangle` SAM
response above to locate the complete sticker, then crops the original image
using that box and asks Muse Spark to return the model-number field's position
relative to the crop. The deterministic crop is `spark_model_number_crop.png`
(920 × 599 pixels; SHA-256
`6ec6e35bbf7d7524db06720648cc3ea659fceab4fc5eaf787968ac3281bc532c`). Its
source bounds are `x=140..1060`, `y=110..709` in the 1200 × 820 source image.

- `sam31_label_replay.json` wraps the raw `output_text` from the genuine live
  SAM 3.1 `white rectangle` call above, preserving its returned box, mask,
  response ID, and provider usage metadata. This is authentic SAM evidence.
- `spark_model_number_crop.png` is the deterministic crop made from that
  returned SAM box.
- `muse_spark_model_number_position.json` is now the authentic live Muse Spark
  response for that crop. It returned HTTP 200 but ended with
  `status=incomplete` because the 256-token output cap was consumed almost
  entirely by reasoning. It returned no output text, field position, or field
  confidence, so it is evidence of an incomplete response, not successful
field localization. The future bounded crop request now allows 512 output
tokens; no follow-up live call was made to verify that larger cap.
- `muse_spark_model_number_position_synthetic.json` preserves the former
  **synthetic offline fixture**. It matches the exact crop hash and dimensions
  and exercises successful response parsing and coordinate mapping; it is not
  a captured Muse Spark crop call. Its illustrative crop-relative box maps to
  the expected source-image reference `x≈205..552`, `y≈360..400`.

The two live calls on 28 October verified SAM label localization and reached
the Spark crop endpoint, but the Spark response was incomplete and supplied no
field geometry. The UI must therefore show the SAM label region alone for that
live result. The named synthetic fixture remains available for deterministic
offline success-path tests, always under an explicit MOCK result mode.
