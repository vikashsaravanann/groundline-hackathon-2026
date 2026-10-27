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

With no key or `GROUNDLINE_FORCE_MOCK=1`, the image fact-extraction adapter
serves `apps/api/fixtures/muse_spark_image_response.json` through the same typed
`output[]` parser and marks the result `mode="MOCK"`. The older
`apps/api/fixtures/analyze_label.json` remains a text-oriented parser fixture.
The UI shows a prominent MOCK badge. A failed live call is never silently
replaced by a fixture — it surfaces as an error.

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

At the time of this initial report, authorized model spend was the text-path
fixture call (~$0.0013, 391 tok) plus this image call (~$0.00156, 691 tok), or
about **$0.0028**. No retries were made.

## Confidence policy

Per-field confidence is passed through only when the model returns a number
(labelled "model-reported" in the UI); otherwise it is `null` and shown as
"Not evaluated". Confidence is never synthesised from prose, and no serial
numbers or evidence references are fabricated.

## Known limitations

- Per-field *evidence references* and on-image *grounding* are not yet produced
  (planned milestone); `evidence` is `null` today.
- The initial verification covered one image call; the later single-attempt
  fixture capture below adds one more synthetic label. Accuracy across many
  label types is not yet characterised.

## Additional multimodal fixture capture — 27 Oct 2026

One explicitly authorized, single-attempt live request was sent directly to
Meta using a synthetic PNG label. No retry was made. A sanitized response
fixture is recorded at `apps/api/fixtures/muse_spark_image_response.json`; the
source image is `apps/api/fixtures/synthetic_product_label.png` (SHA-256
`34a031a10d9910ea89141015600be473f3cb33933687e6e5cedc2934a202cbc4`).

- HTTP status: **200**; response status: `completed`.
- The model read the visible company, product type, model, input voltage and
  synthetic serial correctly: `NORTHSTAR LABS`, `DESK LAMP`, `NSL-2048`,
  `12 V DC`, and `SYNTH-0001`.
- Usage: **1,314 input**, **395 output**, **1,709 total tokens**.
- Cost: the API response reports token usage but no charge. Applying this
  adapter's recorded rates (`$1.25/M` input and `$4.25/M` output) gives an
  estimated **$0.00332125**; this is not an invoice measurement.
- Effort: `low`; `store: false`; maximum output: `512`.
- Exact request shape:

  ```json
  {
    "model": "muse-spark-1.3",
    "input": [{
      "role": "user",
      "content": [
        {"type": "input_text", "text": "<label extraction instruction with objective>"},
        {"type": "input_image", "image_url": "data:image/png;base64,<synthetic PNG bytes>"}
      ]
    }],
    "reasoning": {"effort": "low"},
    "store": false,
    "max_output_tokens": 512
  }
  ```

The raw response for the earlier `GL-DEMO-2048` run was not found in local
records; its successful result remains documented above. The committed fixture
is an authentic sanitized response from the separate `NSL-2048` synthetic-image
request. It retains the real model output, completed status, effort, `store`
setting and usage, while replacing response IDs and omitting opaque encrypted
reasoning metadata. The offline test passes it through the same typed
`output[]` parser as the text response fixture. No more live model calls are
part of this verification.
