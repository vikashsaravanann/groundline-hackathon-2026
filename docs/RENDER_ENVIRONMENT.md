# Render environment variables

## Initial MOCK deployment

| Name | Purpose | Status |
|---|---|---|
| `GROUNDLINE_FORCE_MOCK` | Forces fixture-backed inference even if a model key is later present | `1` in `render.yaml` |
| `ALLOWED_ORIGINS` | Exact browser origins accepted by FastAPI CORS | Required at Blueprint sync; no value committed |
| `PORT` | HTTP listen port | Supplied by Render; do not set manually |

For initial CORS, use the actual Vercel production origin without a trailing slash or path. The frontend origin currently available from the existing project is `https://groundline-hackathon-2026.vercel.app`; confirm current project settings before entering it. Add another origin only when the exact domain is verified.

## Not needed for initial MOCK service

`MODEL_API_KEY` is intentionally absent. Public LIVE requests are not enabled; the health check and MOCK fixture path are nonbillable. `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and privileged Supabase credentials are also not needed: the backend currently has no Supabase client or database operations. Do not add service-role, JWT, or secret keys as a precaution.

The Vercel project has Supabase/Postgres environment-variable names configured, including privileged names. Their values have not been verified for Groundline and are not used by the current app source. Review and remove unused values in Vercel separately; this file does not reproduce them.

Never place provider keys in Docker build args, Dockerfile instructions, GitHub Actions, browser code, or this document.
