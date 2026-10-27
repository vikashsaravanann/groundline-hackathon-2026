# Groundline deployment report

Verification date: 2026-10-27

## GitHub and CI

- Repository: `vikashsaravanann/groundline-hackathon-2026`
- Branch: `main`
- Deployment configuration commit: `ad9095e45b7f6d571ea2a3b51f61d5c4c6382e7f`
- GitHub Frontend CI run `40488580864`: passed.
- GitHub Backend CI run `40488580659`: passed.
- The Render automatic `checksPass` path still needs a follow-up backend commit
  and observed Render deployment; the initial deployment was a Blueprint sync.

## Render

- Workspace: `My Workspace` (`tea-d9vchsu7bikc73d6srv0`)
- Blueprint: `groundline-backend` (`exs-dbg7p6l9fdbs73d1d560`)
- Service: `groundline-api` (`srv-dbg7pe6c6qcc73ek44ig`)
- Repository/branch: `vikashsaravann/groundline-hackathon-2026`, `main`
- Runtime: Docker; Dockerfile `apps/api/Dockerfile`; context `apps/api`
- Plan/region: Free / Singapore
- Health path: `/healthz`; deployment trigger setting: `checksPass`
- Initial deployment: `dep-dbg7peuc6qcc73ek47sg`, commit `ad9095e`,
  trigger `blueprint_sync`, status live.
- Endpoint: `https://groundline-api-8wqb.onrender.com`
- `/healthz`: HTTP 200, JSON mode `MOCK`.
- Synthetic `/api/analyze`: HTTP 200, three fixture facts, cost `$0.00`,
  correlation ID present and exposed. No Meta request was made.
- CORS approved the configured Groundline Vercel origin and its JSON POST
  preflight. No wildcard is used.
- Free service sleeps after inactivity; first requests may have a cold-start
  delay.

## Vercel

- Existing project: `vikashsaravanan/groundline-hackathon-2026`
  (`prj_n8QKE4dlA5NH3a0Gcs9tv5cmrs3v`), connected to the intended repository.
- Root: `apps/web`; framework: Next.js; production branch: `main`.
- The intended `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_SITE_URL` values were
  corrected through the authenticated Vercel CLI for Production and Preview.
  Values are public URLs, not credentials.
- The first automatic production build for `ad9095e` failed because the
  environment value present at that time was not an absolute URL. The values
  have since been corrected. A successful next automatic build is pending.
- The custom frontend domain is shown by Vercel as `Valid Configuration`, but
  a direct HTTPS check from this environment reset its connection; public
  access is not yet verified.

## Supabase, Meta, DNS, and security

- Existing Supabase project `hstznpxnxxxniukkqosi` was not modified. No
  database operations are used by this deployment.
- Render's public service is forced to MOCK mode. No Meta key is configured by
  the Blueprint and no paid inference was performed.
- No DNS records were changed and no API custom domain was added.
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
