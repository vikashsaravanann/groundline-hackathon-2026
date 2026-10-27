# Groundline deployment report

Verification date: 2026-10-27

## GitHub and CI

- Repository: `vikashsaravanann/groundline-hackathon-2026`
- Branch: `main`
- Deployment configuration commit: `ad9095e45b7f6d571ea2a3b51f61d5c4c6382e7f`
- GitHub Frontend CI run `40488580864`: passed.
- GitHub Backend CI run `40488580659`: passed.
- GitHub Backend CI run `40489230845`: passed.
- Vercel Frontend CI: https://github.com/vikashsaravanann/groundline-hackathon-2026/actions/runs/40488580864
- The Render `checksPass` flow was observed: Backend CI passed on commit
  `38bc4b3` before the matching Render deployment began.

## Render

- Workspace: `My Workspace` (`tea-d9vchsu7bikc73d6srv0`)
- Blueprint: `groundline-backend` (`exs-dbg7p6l9fdbs73d1d560`)
- Service: `groundline-api` (`srv-dbg7pe6c6qcc73ek44ig`)
- Repository/branch: `vikashsaravanann/groundline-hackathon-2026`, `main`
- Runtime: Docker; Dockerfile `apps/api/Dockerfile`; context `apps/api`
- Plan/region: Free / Singapore
- Health path: `/healthz`; deployment trigger setting: `checksPass`
- Initial deployment: `dep-dbg7peuc6qcc73ek47sg`, commit `ad9095e`,
  trigger `blueprint_sync`, status live.
- Automatic deployment: `dep-dbg7rjq9lscs73928fa0`, commit `38bc4b3`,
  trigger `new_commit`, status live. It started after Backend CI run
  `40489230845` succeeded.
- CORS allowlist is set to the custom frontend hostname and the actual Vercel
  project aliases. Approved-origin requests and JSON POST preflight were
  verified. The final CORS environment update deploy
  `dep-dbg7sinb9u1s73ch8s9g` completed with status live.
- Endpoint: `https://groundline-api-8wqb.onrender.com`
- `/healthz`: HTTP 200, JSON mode `MOCK`.
- Synthetic `/api/analyze`: HTTP 200, three fixture facts, cost `$0.00`,
  correlation ID present and exposed. No Meta request was made.
- CORS approved the configured Groundline Vercel origin and its JSON POST
  preflight. No wildcard is used.
- Free service sleeps after inactivity; first requests may have a cold-start
  delay.
- Render service settings list `api.groundline.logicintelligencetechnologies.in`.
  DNS resolves through the Render service, but an HTTPS health request from
  this environment reset during TLS negotiation. Custom-domain TLS remains
  unverified.

## Vercel

- Existing project: `vikashsaravanan/groundline-hackathon-2026`
  (`prj_n8QKE4dlA5NH3a0Gcs9tv5cmrs3v`), connected to the intended repository.
- Root: `apps/web`; framework: Next.js; production branch: `main`.
- The intended `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_SITE_URL` values were
  corrected through the authenticated Vercel CLI for Production and Preview.
  Values are public URLs, not credentials.
- The first automatic production build for `ad9095e` failed because the
  environment value present at that time was not an absolute URL. The values
  were corrected and the subsequent automatic production deployment for
  `38bc4b3` is Ready: `https://groundline-hackathon-2026-q8psh9taf-vikashsaravanan.vercel.app`
  (`dpl_3bUwWHG7z9KRGGwKoK5qy4AmpUJQ`).
- Vercel assigned the user-provided domain
  `groundline.logicintelligencetechnologies.in` to this production build and
  reports Valid Configuration. Direct HTTPS from this environment reset at
  TLS negotiation. Generated `vercel.app` deployment URLs redirect to Vercel
  SSO, so public access via those URLs is protected.

## Supabase, Meta, DNS, and security

- Existing Supabase project `hstznpxnxxxniukkqosi` was not modified. No
  database operations are used by this deployment.
- Render's public service is forced to MOCK mode. No Meta key is configured by
  the Blueprint and no paid inference was performed.
- No DNS records were changed by this agent. DNS lookups show the frontend
  hostname resolving to Vercel DNS and the API hostname resolving through the
  Render service.
- No credential values were added to the repository or Docker image. The
  existing Vercel project includes legacy server-side Supabase environment
  variable names; frontend source does not read them. Their continued presence
  should be reviewed by the project owner separately. No secrets were
  retrieved or printed.

## Outstanding verification

1. Confirm the next Vercel production build succeeds with corrected URLs.
2. Confirm the custom frontend domain serves the successful build over HTTPS.
3. Observe a backend commit pass CI and trigger Render automatically under
   `checksPass`.
4. Confirm the desired API custom hostname before making any DNS changes.
5. Verify the user's physical camera workflow with a harmless synthetic label;
   no live camera capture was performed in this deployment run.
6. Safari and Firefox remain unverified.

## Final integration audit addendum — 27 October 2026

This addendum records the latest audit. Historical deployment observations
above remain as evidence of the state at that time.

- GitHub `main`, local `main`, and `origin/main` are at
  `3d62a184cc65f92e2f46aba9fcee86665b28156e`. The working tree was clean.
  The commit raises the frontend request timeout to 120 seconds for Render Free
  cold starts and adds a regression test; it does not automatically retry.
- Vercel project `groundline-hackathon-2026`
  (`prj_n8QKE4dlA5NH3a0Gcs9tv5cmrs3v`) is connected to the expected GitHub
  repository with root `apps/web`. Production deployment
  `dpl_HMEfCGcRpohNoPmB44yyYSfeyvhN` is READY and built from the exact commit
  above. Git deployments are active. Project checks are not configured, so
  GitHub Actions are not represented as a Vercel deployment gate.
- Frontend and backend CI both passed for the latest commit:
  [Frontend CI 40498275515](https://github.com/vikashsaravanann/groundline-hackathon-2026/actions/runs/40498275515)
  and
  [Backend CI 40498275523](https://github.com/vikashsaravanann/groundline-hackathon-2026/actions/runs/40498275523).
- The custom frontend hostname is verified and assigned to the correct Vercel
  project. Its authoritative DNS CNAME matches Vercel's current target. The
  custom API hostname CNAME points to the Render service. Public SSL Labs
  probes reported the frontend at A+/A and API at A; external HTTPS fetches
  returned the Groundline homepage and API `/healthz` JSON respectively. This
  Mac's direct TLS attempts reset without a certificate, so local-network
  access remains discrepant. DNS was not changed.
- Render remains on the live Free/Singapore Docker service and
  `checksPass`; the current live deployment is
  `dep-dbg7sinb9u1s73ch8s9g` at `38bc4b3`. A direct GET to
  `https://groundline-api-8wqb.onrender.com/healthz` returned HTTP 200 and
  `mode: MOCK`. A production Studio request on the new Vercel build returned
  fixture facts and zero estimated cost. No paid Meta inference was run.
- The production Supabase project reference and URL were confirmed through the
  dedicated read-only Groundline connection. Public schema table list and
  migration list were empty. Supabase dashboard marked the project unhealthy
  at inspection time. No database changes were made; application database
  integration remains unimplemented.
- Fresh checks: frontend `npm ci`, lint, TypeScript, 22 tests across 7 files,
  and production build passed; backend pytest passed 46 tests and `pip check`
  reported no broken requirements. The frontend build reported the repository's
  existing tooling deprecation/configuration warnings.
- H02 remains **PARTIALLY VERIFIED** because no physical capture/permission
  workflow was completed. H09 remains **PARTIALLY VERIFIED**: the Chrome
  responsive evidence remains available, but native Safari and Firefox were
  not exercised in this audit. Voice remains deferred; typed input is
  functional.
- The Studio follow-up removes canned goal suggestions and uses a neutral
  free-text placeholder. The page heading/subheading and five-step workflow
  are centered; narrow screens scroll the workflow within its own region.
- A subsequent site-wide alignment pass centers landing-page hero/section
  content, feature and safety cards, footer groups, Studio panel headings, and
  error/loading content while preserving left-aligned text entry and readable
  analysis details. Five-card grids center the final two cards on desktop and
  the final single card at tablet widths.
