# Day 2 release checklist — 27 October 2026

## Publication and source control

- [x] Remote `main` verified at `4431aa4`; branch history is fast-forward only.
- [x] CI lockfile correction `4431aa4` published and both workflows passed.
- [x] Approved source artwork and its derivatives reviewed locally.
- [ ] Branding commit `6406075` and closeout corrections: push authorization
      pending. No push performed.
- [x] Changed text scanned for likely credentials; no credentials modified.

## Local verification

- [x] `apps/web`: `npm ci`, lint, 14 Vitest tests (5 files), `npx tsc --noEmit`,
      production build.
- [x] `apps/api`: 40 pytest tests and `pip check`.
- [x] Chrome 156 responsive sweep at 320, 375, 390, 430, 768, 1024, 1440, and
      1920px; menu, focus, reduced motion, Studio composition, typed upload and
      forced-MOCK analysis.
- [x] Favicon, Next.js icon, Apple icon, and manifest endpoints: 200 with valid
      response content types.
- [x] MOCK response and request trace report zero cost; fixture token counts
      are non-billable sample metadata.
- [ ] Physical camera checks: H02 remains partially verified; no camera was
      detected in this environment.
- [ ] Firefox and Safari/WebKit: unverified (Firefox startup and WebKit protocol
      failures; native Safari not exercised).
- [ ] Production HTTPS crawler checks and search-result favicon observation:
      require authorized public deployment; Google display is not guaranteed.

## Product scope

- Voice intake is explicitly deferred; typed objective input is functional.
- No SAM, browser automation, deployment, production infrastructure, paid model
  call, credential, or schema change was made for closeout.
- Final status: **engineering complete; manual checks and publication approval
  outstanding.**
