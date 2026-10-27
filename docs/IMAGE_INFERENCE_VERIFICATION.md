# Meta image inference — verification (H05)

**Status: VERIFIED (LIVE).** On 27 Oct 2026 one authorized live Muse Spark
image-understanding call was made end-to-end through the Studio and returned a
correct result read from the image.

## Model & transport

- Model: `muse-spark-1.3`
- Base URL: `https://api.meta.ai/v1` · endpoint `POST /responses`
- Auth: `Authorization: Bearer <MODEL_API_KEY>` (backend only; never in the browser)
- Request body (see `apps/api/app/meta_client.py`):
  - `model`, `input`, `reasoning.effort` (explicit, default `"minimal"`),
    `store: false`, `max_output_tokens` (512 default — enough for real text).
- Multimodal `input` (see `build_image_input`): a single user message whose
  `content` is `[{type:"input_text", text:…}, {type:"input_image", image_url:"data:<mime>;base64,…"}]`.

## Response parsing

`parse_response` walks the typed `output[]` array (a reasoning item then a
message item), reads the message's `output_text`, and **raises** `MetaResponseError`
when `status != "completed"` or `error` is non-null — a 200 with
`status=incomplete` is never shown as completed. It never reads
`choices[0].message.content`.

## MOCK behaviour

With no key or `GROUNDLINE_FORCE_MOCK=1`, the adapter serves
`apps/api/fixtures/analyze_label.json` through the *same* parser and marks the
result `mode="MOCK"`. The UI shows a prominent MOCK badge. A failed live call is
never silently replaced by a fixture — it surfaces as an error.

## Live verification run (one authorized call)

- Input: a synthetic text label rendered for the test (fictional product
  "AURORA DESK LAMP", `MODEL NO: GL-DEMO-2048`, serial, warranty, best-before).
  Uploaded through the Studio; the exact captured image was sent (no substitution).
- Objective: "Read the model number from this label."
- Result: HTTP **200**, `status=completed`, `mode=live`.
  - Detected object / extracted field **`GL-DEMO-2048`** — matches the text
    visible in the image (genuine image understanding, not a guess).
  - Usage: **691 total tokens** · estimated cost **≈ $0.00156**.
  - Correlation id (returned as `X-Correlation-ID`, shown in the UI as Analysis
    ID): `fcab5c7e-1bb`.
- No credential appeared in any log, response body, or header (verified:
  `grep -cE 'Bearer|LLM_|MODEL_API_KEY='` over the server log → 0).

Authorized model spend this session: text-path fixture call (~$0.0013, 391 tok)
+ this image call (~$0.00156, 691 tok) ≈ **$0.0028 total**. No retries were made.

## Confidence policy

Per-field confidence is passed through only when the model returns a number
(labelled "model-reported" in the UI); otherwise it is `null` and shown as
"Not evaluated". Confidence is never synthesised from prose, and no serial
numbers or evidence references are fabricated.

## Known limitations

- Per-field *evidence references* and on-image *grounding* are not yet produced
  (planned milestone); `evidence` is `null` today.
- Only one live call was made (cost discipline); broader accuracy across many
  label types is not yet characterised.
