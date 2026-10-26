# New work provenance

All code in this repository was written between 26 October and 4 November 2026
for the Meta Global AI Developer Hackathon. Nothing here predates the event.

## Accounts and identifiers

| Thing | Value |
|---|---|
| GitHub | vikashsaravanann  (double n) |
| Vercel scope | vikashsaravanan  (single n) |
| Meta Model API team | 2639715836462932 |
| Modal workspace | createwithvikash |

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
