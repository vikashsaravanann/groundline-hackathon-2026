# Day 3 acceptance checklist

Baseline: `ae111441a8875f250d66ff7bdc4338dcd02a2667` (2026-10-28)

| Gate | Status | Evidence |
|---|---|---|
| D3-01 Day 2 baseline preserved | VERIFIED | Existing API and Studio tests remain passing. |
| D3-02 Hosted SAM 3.1 adapter | IMPLEMENTED, LIVE NOT VERIFIED | `sam_client.py`; exact model `sam-3.1`. |
| D3-03 Request format | IMPLEMENTED, LIVE NOT VERIFIED | Offline payload contract test; corrected confidence field to `metadata.include_confidence` after one HTTP 400. |
| D3-04 Stream parser | VERIFIED OFFLINE | Pinned `meta-sam-parser==0.1.0`; synthetic fixture, empty and incomplete stream tests. |
| D3-05 Bounding boxes | VERIFIED OFFLINE | Source-pixel to normalized conversion and endpoint assertions. |
| D3-06 Segmentation masks | VERIFIED OFFLINE | Synthetic one-bit parser fixture decoded to a bounded SVG path. |
| D3-07 User target selection | VERIFIED OFFLINE | Studio target field; target phrase sent only on explicit submit. |
| D3-08 Image correspondence | VERIFIED OFFLINE | Backend source SHA-256, client hash/dimension check and stale request guards. |
| D3-09 Overlay mapping | VERIFIED BY COMPONENT TEST | SVG viewBox follows source dimensions; normalized box maps to source pixels. Visual browser E2E remains unverified. |
| D3-10 Human review | VERIFIED BY COMPONENT TEST | Select, confirm and reject controls; keyboard activation test. |
| D3-11 No-match | VERIFIED OFFLINE | Empty completed stream test and explicit API/UI state. |
| D3-12 State/cancellation | VERIFIED BY TEST | Reset/image replacement invalidates grounding requests; late response test. |
| D3-13 Provenance | VERIFIED OFFLINE | MOCK fixture and LIVE mode kept distinct; no fallback. |
| D3-14 Security | PARTIAL | Shared token, fail-closed Redis quotas, bounded validation implemented and unit tested; production access token/Redis not configured. |
| D3-15 Cost discipline | PARTIAL | Explicit submit only, quota counters, concurrency lease, no retry; public deployment stays forced MOCK. Provider hard billing limit was not verified. |
| D3-16 Backend suite | VERIFIED | 100 passed; `pip check` clean. |
| D3-17 Frontend suite | VERIFIED | lint, TypeScript, 33 tests and build passed. |
| D3-18 Docker | VERIFIED | Build and forced-MOCK health/grounding smoke passed locally. |
| D3-19 CI/CD | VERIFIED WITH DOMAIN LIMITATION | Commit `9f2cc5ddfc82aba657fb443cf478bbe9bc107aea` is on `origin/main`; Frontend CI `40661419880` and Backend CI `40661419921` succeeded. Render deployment `dep-dbgrlm2vcj2c73dom1dg` is Live. Vercel production deployment is Ready for this commit. Custom-domain TLS remains unreachable from the participant Mac. |
| D3-20 Controlled live segmentation | BLOCKED FOR THIS RUN | One request returned HTTP 400; no retry. No real geometry or mask was captured. |

## Release state

Render Blueprint keeps `GROUNDLINE_FORCE_MOCK=1`. Live SAM is not enabled in public production. A corrected request now places `include_confidence` inside the `metadata` object according to current Meta docs. Because the one attempt returned 400 and the instruction prohibits retrying a permanent request unchanged, this run made no second provider call. Live entitlement, real geometry, real mask overlay and public release are not claimed complete.

Local browser file upload was not verified: the connected Chrome extension denied upload until the global “Allow access to file URLs” setting is enabled. That setting was left unchanged.

## Release verification addendum — 2026-10-28

- GitHub `main` and local `HEAD` both resolve to `9f2cc5ddfc82aba657fb443cf478bbe9bc107aea`; working tree is clean.
- Frontend CI run `40661419880` and Backend CI run `40661419921` both completed successfully on that commit.
- Render service `srv-dbg7pe6c6qcc73ek44ig` automatically deployed that commit after checks passed. Deployment `dep-dbgrlm2vcj2c73dom1dg` is `live`; service config reports repository `vikashsaravanann/groundline-hackathon-2026`, branch `main`, Dockerfile `./apps/api/Dockerfile`, context `./apps/api`, Singapore, Free, health check `/healthz`, and `autoDeployTrigger=checksPass`.
- `GET https://groundline-api-8wqb.onrender.com/healthz` returned HTTP 200 with `status=ok`, version `0.1.0`, and mode `MOCK`. The deployed `/api/ground` returned HTTP 200 for the exact synthetic fixture (`desk lamp`), mode `MOCK`, one fixture object, source dimensions 800×600, matching source SHA-256, and estimated cost USD 0. This is offline-fixture evidence, not a SAM inference.
- CORS preflight from `https://groundline.logicintelligencetechnologies.in` to the Render API returned HTTP 200 and the exact allowed origin.
- The intended Vercel project dashboard showed a Ready production deployment for commit `9f2cc5d` and the custom frontend domain assigned to Production. The generated `vercel.app` deployment URL is behind Vercel SSO, so it does not establish public unauthenticated access.
- TLS requests to both `https://groundline.logicintelligencetechnologies.in/` and `https://api.groundline.logicintelligencetechnologies.in/healthz` reset during the TLS handshake from this Mac, before a peer certificate was presented. Render's Custom Domains page separately reports the API hostname as Verified / Certificate Issued; Vercel's domain page reports Valid Configuration. These dashboard states do not override the failed live TLS observation. No DNS records or provider settings were changed, and an independent mobile network was unavailable for this check.
- D3-20 remains incomplete: the sole authorized live request returned HTTP 400 with the malformed confidence-field placement recorded above. No retry or further paid inference occurred. Live entitlement, actual SAM geometry/mask, and visual alignment remain unverified.
- Browser file-upload E2E and Safari/Firefox checks remain unverified. The existing Vercel production build and Render deployment do not substitute for those checks.

**Day 3 verdict: DAY 3 ENGINEERING COMPLETE — LIVE VERIFICATION PENDING.** Public production remains forced MOCK. Re-run one controlled SAM request only after renewed authorization; first resolve public-domain TLS/accessibility and complete a real-browser overlay check.
