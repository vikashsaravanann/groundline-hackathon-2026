# Groundline Day 3 implementation

Date: 2026-10-28

## Scope and status

Day 3 adds a SAM 3.1 image-grounding capability to the existing FastAPI and Studio flow. The backend adapter, strict validation, synthetic offline fixture, normalized endpoint, Studio target selection and overlay are implemented. Offline verification passes. Live verification is **pending**: one authorized request returned HTTP 400 and was not retried. Public Render remains forced to MOCK.

## Reused application components

- Existing camera and upload workflow and `SelectedImage` dimensions/base64.
- Existing FastAPI application, capability enum/router, CORS allowlist and correlation-ID conventions.
- Existing Studio hook and explicit analysis state machine.
- Existing Groundline design components and `render.yaml` deployment.

## Implementation

- `apps/api/app/sam_client.py` validates actual PNG/JPEG/WebP bytes and dimensions, builds the hosted Responses API request, consumes SSE through the pinned `meta-sam-parser`, validates boxes and masks, and normalizes source-pixel geometry.
- `POST /api/ground` accepts one image and one short noun phrase, hashes the source bytes, returns normalized boxes/masks and provenance, and serves a synthetic fixture only for its exact hash, dimensions and phrase when forced MOCK is active.
- Restricted LIVE requires `GROUNDLINE_LIVE_GROUNDING_ENABLED=1`, `MODEL_API_KEY`, a server-side access token and a shared Redis quota store. Missing controls fail closed. No automatic fallback or retry occurs.
- Studio adds an explicit grounding action, access-code entry for restricted preview, selection/rejection/confirmation, box and SVG mask overlay, no-match and error handling, cancellation and stale-image checks.
- Public Render configuration keeps `GROUNDLINE_FORCE_MOCK=1`; grounding is enabled only for the exact synthetic offline sample. No public paid inference was activated.

## Fixtures

`apps/api/fixtures/sam31_synthetic_image.png` and `sam31_synthetic_response.json` are synthetic offline data. The output text and mask are hand-authored for deterministic parser/overlay tests; they are not represented as provider output.

## Live request record

One request was sent on 2026-10-28 to `https://api.meta.ai/v1/responses`, model `sam-3.1`, for the synthetic `desk lamp` image. It returned **HTTP 400**. No provider response body was retained, no retry was made, and no live segmentation fixture was created. The request shape included `model`, one user `message` with `input_text` and a PNG `input_image` data URL, `stream: true`, `metadata.mask_encoding: "one_bit"`, and an incorrectly top-level `include_confidence: "true"`. Current Meta documentation places `include_confidence` inside `metadata`; the code and offline tests now do so. This documentation correction does not establish live success. No further live calls were made.

Meta's current instructions specify a short noun phrase, image `input_image`, `stream: true`, `metadata.mask_encoding`, and `metadata.include_confidence`; the stream must complete at `response.completed`. See [SAM overview](https://dev.meta.ai/docs/sam/overview), [SAM segmenting](https://dev.meta.ai/docs/sam/segmenting), and [SAM client libraries](https://dev.meta.ai/docs/sam/client-libraries).

## Verification

- Backend: 100 tests passed; `pip check` reported no broken requirements.
- Frontend: lint and TypeScript check passed; 33 tests passed; Next.js production build passed.
- Docker: `groundline-api:day3` built; container `/healthz` returned 200 in MOCK; `/api/ground` returned 200 with one validated synthetic SVG mask and estimated cost $0.
- Browser: local Studio page opened and rendered. The browser upload automation was blocked because Chrome requires the extension setting “Allow access to file URLs”; that permission was not broadened. SVG geometry normalization is covered by a DOM test against an 800×600 viewBox, but visual browser E2E remains unverified.
- The first check run caught an invalid target-phrase test case and React state-reset lint issue; both were corrected and the passing results above are after those fixes.
- A `StarletteDeprecationWarning` about `httpx` in `TestClient` remains; the tests pass. Vite also reports its existing `configLoader: 'native'` compatibility warning.
- Render/Vercel deployment and public-domain verification are pending publication.

## Remaining Day 3 acceptance gates

1. Repeat a controlled live SAM request only in a separately authorized run after the corrected payload is reviewed. Do not retry the failed HTTP 400 within this run.
2. Visually verify a real returned mask against the synthetic source image.
3. Provision and verify shared Redis quotas plus restricted token configuration before any LIVE service activation.
4. Build and smoke-test the Docker image; publish through CI; verify Render and Vercel.

The synthetic fixture validates offline parser and UI behavior. It does not satisfy the live segmentation acceptance gate.
