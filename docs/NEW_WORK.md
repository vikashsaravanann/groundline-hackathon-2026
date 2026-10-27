# New work provenance

All code in this repository was written between 26 October and 4 November 2026
for the Meta Global AI Developer Hackathon. Nothing here predates the event.

## Accounts and identifiers

| Thing | Value |
|---|---|
| GitHub | vikashsaravanann  (double n) |
| Vercel scope | vikashsaravanan  (single n) |

The Meta Model API team ID and the Modal workspace name are recorded in a local
note outside this repository. They are not credentials, but this file is
permanently public and publishing them buys nothing.

## Day 1 — 26 October 2026

- Meta Model API account created; $150 credits claimed and applied the same evening.
- First live call to muse-spark-1.3 verified: HTTP 200, status completed, error null.
  Defaults observed and to be overridden in our adapter:
    - reasoning.effort = high  (253 of 263 output tokens were reasoning tokens)
    - store = true
  Response shape is output[] of typed items, not choices[0].message.content.
- Partner credit requests submitted: Baseten, Modal, Fireworks.
- Repository initialised; identity pinned repo-locally.

### Day 1 close — 26 Oct 2026, 14:00–23:15 IST

- Hours completed: H01–H10 (all ten).
- Commits: f9670de (init), 44f6580 (health endpoint + leak test).
- Evidence: `python -m pytest -q` → 2 passed. `GET /healthz` → 200,
  mode "MOCK" with no key exported.
- Model spend: one verified call, muse-spark-1.3, ~$0.10 of $150.
- Blockers recorded, not hidden: Axis standing-instruction decline on the
  MasterCard required switching to a Visa before the account cleared.
  Partner credits (Baseten, Modal, Fireworks) requested, all pending review.
- Next: Day 2, camera capture and text/voice intake. Build the Meta adapter
  with reasoning.effort set explicitly and store=false. Attend Agents 101.

### Day 1 final closure & verification — 26 Oct 2026, IST

Status legend: VERIFIED (independent in-session evidence) · PARTICIPANT-REPORTED
(logged by participant, not independently checked) · PENDING AUTH (awaiting
authorization) · DEFERRED (belongs to a later day).

- Git state — VERIFIED. Local `main` HEAD `aa8b47a`, 4 commits ahead of
  `origin/main` (`f78a090`), clean working tree. Original hackathon commits
  intact; no history rewritten.
- Local-only commits: `318ec0d` acceptance criteria · `441bf24` backend
  hardening + pinned deps + expanded tests + CI · `3c71f5e` /healthz reduced to
  `{status, version}` + CI rename + publishable-key docs · `aa8b47a` ignore
  Supabase CLI local state.
- Backend tests — VERIFIED. `python -m pytest -q` → 17 passed, 1 warning
  (third-party Starlette httpx deprecation). `pip check` → no broken
  requirements. Live uvicorn boot returns `{"status":"ok","version":"0.1.0"}`.
- `/healthz` — VERIFIED. Public body is `{status, version}` only; no
  key-presence field, no key value, no Meta call (no charge).
- Meta Model API — VERIFIED LIVE (authentication + request). One authorized
  minimal call to `muse-spark-1.3` via `https://api.meta.ai/v1/responses`:
  HTTP 200, usage recorded (31 tokens), no secret exposed. `store=false`,
  `reasoning.effort="minimal"`. Generated-text output NOT verified — the 16-token
  cap left the response text-empty (`status: incomplete`); text-generation
  quality is DEFERRED. Cost negligible (~$0.00009).
- Supabase — VERIFIED (linked). Dedicated project `groundline-hackathon-2026`
  (ref `hstznpxnxxxniukkqosi`), `ACTIVE_HEALTHY`, `linked=True`, created in the
  event window. Not `csc-circle-production`. No migrations, no DB writes, no DB
  password handled. CLI local state (`supabase/.temp/`) gitignored.
- Secret rotation — PARTICIPANT-REPORTED; account-level verification pending.
  A Supabase service_role key was exposed in chat and the participant reports
  rotating it. Independent in-session checks: the key is NOT in any tracked file
  and NOT in git history (full-history scan). The old credential was not
  reproduced or tested.
- GitHub Actions CI — CONFIGURATION REVIEWED; remote execution PENDING. Workflow
  `.github/workflows/backend-ci.yml` is valid, least-privilege
  (`permissions: contents: read`), uses no secrets, triggers no billable calls.
  Not yet run because it requires a push, which is held for authorization.
- Publication — PENDING AUTH. 4 local commits reviewed and secret-scanned; not
  pushed. No force-push, no history rewrite.
- Published — VERIFIED. `git push origin main` fast-forwarded
  `f78a090 -> 03b1a03`; remote HEAD matches local `03b1a03`. All five Day 1
  commits are on GitHub. No force-push, no history rewrite.
- Remote CI — VERIFIED GREEN. Backend CI run 40378168304 (push of `03b1a03`)
  completed with success; "API tests" job passed in 12s. Non-fatal annotations
  only (Node 20 action deprecation; ubuntu-latest migration notice).
- Day 1 verdict: DAY 1 ENGINEERING COMPLETE — EXTERNAL VERIFICATION PENDING
  (portal/billing confirmations; CI now green). Engineering + publication done.
- Day 2 entry criteria: Next.js frontend foundation, camera permission +
  snapshot capture, typed intake, image size/MIME validation, Muse Spark
  image-analysis adapter (reuse the verified base URL / model id / auth pattern)
  with a safe fixture fallback, loading/error states, tests, mobile layout.

## Day 2 — 27 October 2026

All work local; nothing pushed (remote still at `4b8467f`; `apps/web` not yet
published). No history rewrite, no force-push, no cloud changes.

- Backend adapter + endpoint: `app/meta_client.py` (single entry point, explicit
  reasoning effort, `store=false`, timeout + one retry, typed `output[]` parse),
  `POST /api/analyze` with pydantic validation, MOCK/live switch (rule 7), and
  request tracing (correlation id, tokens, running cost; key never logged).
  Commits `c88f3ff`, `9c0bf44`.
- Frontend: premium light-glass landing (`/`) + functional Studio (`/studio`) —
  consent-gated camera + upload, in-browser resize/MIME/4 MiB validation, typed
  objective, explicit 8-state machine, editable normalized results, MOCK/LIVE
  badge. Next.js 16, TS strict, Tailwind 4, Poppins, Motion, lucide, Vitest.
  Commits `e922f54` (first capture flow), `b2c62ba` (full workbench).
- Live image understanding VERIFIED: one authorized call read `GL-DEMO-2048`
  from a synthetic label; 691 tokens, ~$0.00156, status completed, no secret
  leaked. See `docs/IMAGE_INFERENCE_VERIFICATION.md`.
- Authorized model spend to date: two live calls (text fixture ~$0.0013 +
  image ~$0.00156) ≈ $0.0028 of the $150 credit. No retries; none in CI/tests.
- Added Frontend CI (`.github/workflows/frontend-ci.yml`, MOCK-only, no
  credentials). Voice intake deferred (`docs/VOICE_DECISION.md`); typed input is
  the supported path. New records: `DAY2_COMPLETION_REPORT.md`,
  `FRONTEND_DESIGN_AUDIT.md`, `REQUEST_TRACING.md`.
- Tests: frontend 14 (Vitest), backend 40 (pytest), both green; FE build static;
  `npm audit` 0 vulns; `pip check` clean.
- Submission portal: not accessed (no authenticated access this session); fields
  to confirm manually tracked in `docs/SUBMISSION_CHECKLIST.md`.

## Approved Groundline logo implementation — 27 October 2026

- The user approved the supplied `Groundline-logo.png` artwork as the brand
  source of truth. Its exact 1254 × 1254 RGB PNG bytes are preserved at
  `apps/web/public/brand/groundline-approved-original.png`; the copy was checked
  byte-for-byte against the supplied local original.
- Derived a clean symbol crop and circular icon exports from that artwork,
  including ICO frames, Next.js browser/Apple icons, PWA icons, a maskable icon,
  and a monochrome fallback. The approved geometry and Poppins wordmark remain
  the application identity; no CSC or unrelated brand art was used.
- Integrated the mark in the shared header, footer/error wordmark, and existing
  Studio objective field. Configured App Router metadata, the manifest, and
  social preview metadata. See `docs/BRAND_IMPLEMENTATION.md`.
- This branding work is local and separate from the lockfile-only `4431aa4`
  commit. No production credentials, paid model calls, cloud resources, or
  backend schemas were changed.

## Day 2 publication and closeout — 27 October 2026

- Verified remote `main` remains `4431aa4`. Its lockfile-only correction is
  published; Frontend CI run 40478638492 and Backend CI run 40478638474 passed.
- The approved-logo commit remains local and unpublished pending explicit
  authorization. The GitHub CLI credential is invalid; connected GitHub
  read-only access confirmed the remote identity, branch and workflow run.
- Final smoke verification found and fixed a 390px Studio objective-chip/count
  collision. MOCK API responses and trace request cost now report zero dollars;
  fixture token counts are not billing data. No paid requests were made.
- Voice remains deferred; typed input remains the supported intake. No SAM or
  later-milestone work was started. Physical camera, native Safari, Firefox,
  WebKit automation, and public search crawler appearance remain unverified.

## Camera capture follow-up — 27 October 2026

- Fixed the Retake state so a previous still cannot hide the restarted camera
  preview. Capture waits briefly for a presented frame, prevents duplicate
  capture taps, requests higher-resolution video, and best-effort enables
  supported continuous autofocus.
- Kept the camera viewport dimensions stable through live, captured, and
  retake states; uploaded images retain their natural aspect ratio.
- Frontend verification: 27 tests passed; TypeScript, lint, and production
  build passed. The local Chrome camera permission request remained pending,
  so no physical camera capture/retake pass is claimed. Safari/Firefox remain
  unverified. Publication and deployment are recorded below.

### Publication — 27 October 2026

- Camera correction published to `main` as `9b7abb0ea7a380c1d92df372475bebc53e0c773e`.
- Frontend CI run `40527383557` and Backend CI run `40527383665` both succeeded.
- Vercel production deployment `dpl_13ESNEhXXpTGB9hj8htVgTZwVuyv` is READY for
  the published commit. Its aliases include the Groundline custom domain.
- The existing Render backend was not redeployed because this change contains
  no backend files. Its `/healthz` GET returned HTTP 200 in MOCK mode.
- HTTPS to the custom frontend hostname reset during TLS negotiation from this
  Mac, so public reachability through that hostname remains unverified here.
