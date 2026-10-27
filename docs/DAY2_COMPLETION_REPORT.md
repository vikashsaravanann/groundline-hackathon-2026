# Day 2 completion report — 27 Oct 2026

Milestone: Camera Capture and Text/Voice Intake. Local engineering + one
authorized live image verification. Nothing pushed.

## Commits

- Start of day-2 frontend work: `9c0bf44` (backend tracing) → baseline for the
  frontend rebuild.
- `b2c62ba` feat(web): premium light-glass landing + functional Studio workbench.
- Finalization commit (this report): adds frontend CI, live-image verification,
  honesty refinements, and docs.

Branch `main`, ahead of `origin/main` (remote at `4b8467f`; `apps/web` not yet
published). Not pushed. No history rewrite.

## H01–H10 completion matrix

| Block | Status | Evidence |
|---|---|---|
| H01 Servers / CORS / typed request | VERIFIED | FE (3001) + BE (8000) ran together; `/healthz` 200; Studio rendered; `POST /api/analyze` 200; CORS allows the dev origin, rejects others (`test_health.py`). |
| H02 Camera consent / capture | PARTIALLY VERIFIED | Consent gate, permission classification, capture, track cleanup, upload fallback implemented + unit-tested (no getUserMedia before user action; unsupported path). Real-camera consent/live-video not exercisable in headless automation — recorded as a manual check. |
| H03 Snapshot processing & boundaries | VERIFIED | In-browser resize (≤1280px edge), MIME validation, 4 MiB ceiling, reset clears state; `estimateBytes` + backend tests. Captured/uploaded image is the one submitted (verified in the live run). |
| H04 Backend input validation | VERIFIED | Empty, whitespace (4 variants), >500 chars, unsupported MIME, oversized, invalid base64 all rejected (422). 40 backend tests pass. |
| H05 Muse Spark image integration | VERIFIED (LIVE) | One authorized live call: read `GL-DEMO-2048` from a synthetic label, 691 tok ≈ $0.00156, status completed, no secret leaked. See `IMAGE_INFERENCE_VERIFICATION.md`. |
| H06 State management & reset | VERIFIED | Explicit 8-state machine, stale-response guard, cancel, reset keeps objective, camera released on cleanup; `useStudio` tests + live run. |
| H07 Voice intake | DEFERRED BY HANDBOOK | `VOICE_DECISION.md`: deferred; typed fallback works; no fake mic button. |
| H08 Observability | VERIFIED | Correlation id (+`X-Correlation-ID` header), source, model, duration, tokens, cost, status; secrets never logged. `REQUEST_TRACING.md`. |
| H09 Cross-browser / a11y / mobile | PARTIALLY VERIFIED | Chrome verified at 1440px + 390px (landing + studio), keyboard + focus, reduced-motion, MOCK/LIVE labelling. Safari/Firefox and 320/430/768/1024/1920 are recommended follow-ups. `FRONTEND_DESIGN_AUDIT.md`. |
| H10 Release gate | VERIFIED | FE lint clean, 14 Vitest tests, production build static; BE 40 pytest pass; `pip check` clean; `npm audit` 0 vulns; no secrets committed; `/healthz` unchanged; local commit created. |

## Tests actually run

- Frontend (`apps/web`): `npm run lint` clean · `npm test` → 14 passed (5 files)
  · `npm run build` → clean, `/` and `/studio` static.
- Backend (`apps/api`): `python -m pytest -q` → 40 passed, 1 warning
  (third-party Starlette httpx notice) · `pip check` → no broken requirements.

## Model usage (authorized)

At the time of this report, two authorized live calls had been made in this
project: text-path fixture (~$0.0013, 391 tok) + image verification (~$0.00156,
691 tok) ≈ **$0.0028**. No retries, no decorative calls, none in tests or CI.

## Security

No credential in the browser; only `NEXT_PUBLIC_API_BASE_URL` exposed. Live
server log scanned: 0 `Bearer`/`LLM_`/`MODEL_API_KEY=` hits. `.env*` gitignored.

## Remaining / handoff

- Publish `apps/web` to the remote and run the new Frontend CI (requires a push —
  held for authorization).
- Cross-browser + full-viewport sweep; real-device camera check.
- Next milestone: SAM 3.1 grounding (see the completion report's handoff notes).

## Publication and final verification addendum — 27 October 2026

This dated addendum supersedes the earlier publication-pending statements above;
the earlier entries remain as chronological evidence.

- GitHub identity/repository verified through the connected GitHub read API:
  `vikashsaravanann` / `vikashsaravanann/groundline-hackathon-2026`. Remote
  `main` is `4431aa4388c0923e660990dd79fe9bb26a6be9db` (`4431aa4`). Local
  branding work was based on `4431aa4` and is not pushed. No divergence or
  history rewrite.
- The separate lockfile correction `4431aa4` is published. Frontend CI run
  [40478638492](https://github.com/vikashsaravanann/groundline-hackathon-2026/actions/runs/40478638492)
  completed successfully on that commit; Backend CI run
  [40478638474](https://github.com/vikashsaravanann/groundline-hackathon-2026/actions/runs/40478638474)
  completed successfully. Branding assets are therefore not yet present on
  GitHub.
- Local branding commit `6406075` preserves the approved original artwork
  byte-for-byte and adds the identity integration. Final local changes include
  a small responsive Studio composer wrap correction and the MOCK cost reporting
  correction. No production deployment or infrastructure change occurred.
- Frontend: `npm ci` succeeded; lint passed; Vitest: 14 tests across 5 files;
  TypeScript `npx tsc --noEmit` passed; production build passed and statically
  generated `/`, `/studio`, icon, and manifest routes.
- Backend: `python -m pytest -q` (using the project `.venv` because the bare
  `python` command is unavailable) passed 40 tests; `pip check` reported no
  broken requirements. One third-party Starlette/httpx deprecation warning
  remains. MOCK responses, request-cost logs, and Studio estimated cost now
  report $0; fixture token counts are descriptive only. No paid model calls
  were made for this verification.
- Chrome for Testing 156.0.8078.4: no horizontal overflow at 320, 375, 390,
  430, 768, 1024, 1440, or 1920 CSS px. Mobile menu toggled; reduced-motion
  preference, visible keyboard focus, Studio icon/input and objective-chip
  spacing, typed upload and MOCK analysis passed. No page errors. Icon endpoints
  returned HTTP 200 with `image/x-icon`, `image/png`, and
  `application/manifest+json` content types. Updated visual evidence is in
  `docs/brand-qa/`.
- H02 remains **PARTIALLY VERIFIED**. No physical camera was detected in this
  environment; real consent, preview, capture, stop/release and retake could
  not be exercised. Automated tests and a simulated denial path verify the
  interaction boundary and upload fallback, but do not replace a device test.
- Firefox Nightly was present but could not start reliably (sandbox graphics
  failure); the cached WebKit binary was incompatible with the installed
  Playwright protocol. Native Safari and Firefox remain unverified. H09 remains
  **PARTIALLY VERIFIED**. MOCK fixture badges remain explicit; typed input is
  supported, while voice is explicitly deferred in `VOICE_DECISION.md`.
- Branding publication is prepared as a fast-forward candidate, but requires
  explicit authorization. The GitHub CLI credential is invalid in this
  environment; read-only remote verification used the connected GitHub tool.
  Search crawler/favicon appearance requires a public deployment and remains
  externally unverified. No SAM or later milestone work was started.

## Final production and Day 2 audit addendum — 27 October 2026

This entry supersedes the publication and deployment status above while
preserving it as chronological evidence.

- Published and local `main` are at
  `3d62a184cc65f92e2f46aba9fcee86665b28156e`; working tree clean. The commit
  adds a 120-second client timeout to accommodate the observed Render Free
  cold-start window and does not add automatic retries.
- Vercel production deployment
  `dpl_HMEfCGcRpohNoPmB44yyYSfeyvhN` is READY from that commit. Frontend CI
  [40498275515](https://github.com/vikashsaravanann/groundline-hackathon-2026/actions/runs/40498275515)
  and Backend CI
  [40498275523](https://github.com/vikashsaravanann/groundline-hackathon-2026/actions/runs/40498275523)
  passed. The project has Git auto-deploys, but no Vercel deployment check is
  configured to gate them on GitHub Actions.
- The Render provider hostname returned HTTP 200 with `mode: MOCK`; the
  production Studio request returned fixture results and zero estimated cost.
  No paid model request was made. Render remains on its prior live deployment
  because this commit changed frontend files only.
- Both custom domains have verified provider DNS assignments and external
  trusted-TLS results (frontend A+/A, API A). Independent HTTPS fetching
  succeeded; direct TLS from this Mac reset, so that path remains a local
  network discrepancy. No DNS changes were made.
- Supabase read-only inspection targeted project `hstznpxnxxxniukkqosi`:
  URL matched that project, public tables and migrations were empty, and the
  dashboard showed unhealthy at inspection time. No schema or project changes
  were made. Groundline does not currently implement application database
  operations.
- Latest frontend checks passed: install, lint, TypeScript, 22 tests across 7
  files, and production build. Backend: 46 pytest tests passed and `pip check`
  found no broken requirements.
- H02 remains **PARTIALLY VERIFIED**: no real camera permission, capture,
  retake, or stop/release sequence was performed. H09 remains
  **PARTIALLY VERIFIED**: prior Chrome responsive evidence is retained, but
  native Safari and Firefox workflows remain unverified. Typed input remains
  available; voice is explicitly deferred.
- The public Supabase project showed no tables/migrations and no application
  integration is implemented. No future automation module was started.
- The goal composer contains no suggested objective buttons or sample prompt;
  users enter the information they want analyzed. The Studio heading and
  five-step progress row are centered, with local horizontal scrolling on
  narrow viewports.
- The follow-up alignment pass centers page-level content groups across the
  landing page, Studio, footer, and status pages. Input and detailed analysis
  content retain readable text alignment. The final row in both five-card
  landing sections is centered at tablet and desktop breakpoints.

### Camera capture correction — 27 October 2026

- Fixed Retake's stale-still state: starting a new camera session clears the
  previous captured/uploaded image before the video preview is shown.
- Camera capture now waits for a presented video frame (bounded to 500 ms when
  `requestVideoFrameCallback` is available), prevents duplicate capture clicks,
  and keeps Stop/Switch disabled while the still is being encoded.
- Camera requests prefer 1920 × 1080 at up to 30 fps and enable continuous
  autofocus only when the browser/device exposes that capability. Unsupported
  focus controls remain non-blocking.
- The camera viewport retains the live stream's dimensions while transitioning
  to the dashed-frame crop and back to Retake, avoiding a camera/still layout
  jump. Uploaded images continue to use their own aspect ratio.
- Fresh frontend verification: 27 Vitest tests passed; `npx tsc --noEmit`,
  `npm run lint`, and `npm run build` passed. The local Studio rendered in
  Chrome. Its camera permission request remained pending in this browser
  environment, so this is not a physical camera capture/retake verification.
- H02 remains **PARTIALLY VERIFIED** until camera permission, live preview,
  readable capture, retake, stop/track release, and upload fallback are tested
  on the intended phone. H06's retake path has a regression test, but the whole
  milestone is not signed off. H09 remains **PARTIALLY VERIFIED** pending the
  handbook's cross-browser/accessibility evidence. Voice remains deferred as
  allowed by the Day 2 go/no-go gate.

### Final H01–H10 status

| Gate | Status | Current evidence |
|---|---|---|
| H01 Frontend/backend and typed request | VERIFIED | Production Studio completed a MOCK request; provider health is 200. |
| H02 Physical camera | PARTIALLY VERIFIED | Browser camera code is covered, but real permission/capture/cleanup not performed. |
| H03 Image validation and processing | VERIFIED | Existing frontend/backend validation tests pass. |
| H04 Input validation | VERIFIED | Current backend suite: 46 passed. |
| H05 Muse Spark LIVE verification | VERIFIED (prior authorized evidence) | Historical one-off evidence retained; no repeat paid call. |
| H06 State and cancellation | VERIFIED | Existing state-management tests and reset flow remain. |
| H07 Voice | DEFERRED AS PER HANDBOOK | Typed objective remains the supported input. |
| H08 Tracing and MOCK cost | VERIFIED | Production response was MOCK, zero estimated cost, correlation tracing; API source logs metadata only. |
| H09 Responsive/accessibility/browsers | PARTIALLY VERIFIED | Chrome responsive evidence exists; Safari and Firefox not exercised. |
| H10 Release | VERIFIED | Commit published, latest frontend/backend CI passed, Vercel production READY. |

### Multimodal/provider verification addendum — 27 October 2026

- One additional authorized Meta request was made directly against the synthetic
  image path: HTTP 200, `low` reasoning, `store:false`, and 1,314 input / 395
  output tokens. Muse Spark correctly read all five printed label values. The
  sanitized authentic response fixture and parser regression test are in
  `apps/api/fixtures/muse_spark_image_response.json` and
  `apps/api/tests/test_analyze.py`. Estimated cost from the adapter's recorded
  token rates is $0.00332125; the provider response did not report invoice cost.
- Baseten is a separate adapter, routed only to `GENERAL_TEXT_REASONING` when
  explicitly enabled by a backend operator. Its OpenAI-compatible response
  parser, request shape, and synthetic fixture are tested offline only; no
  Baseten request was made. Image fact extraction continues to default to Meta.
- The authorized Render service inspection does not expose environment
  variable names or values, so this work did not independently verify whether
  `BASETEN_API_KEY` is present. No attempt was made to bypass that boundary,
  and no key was copied into the local `.env`. Baseten remains uncalled.
- The connected device inventory exposed the Mac and browser tabs, but no
  running iPhone Mirroring or physical phone surface. H02 remains
  **PARTIALLY VERIFIED**; a real camera permission/capture/stop/retake check is
  still needed. Safari and Firefox end-to-end checks also remain outstanding,
  so H09 remains **PARTIALLY VERIFIED** and Day 2 is not fully closed.
