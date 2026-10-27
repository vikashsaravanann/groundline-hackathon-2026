# Render environment variables

## Initial MOCK deployment

| Name | Purpose | Status |
|---|---|---|
| `GROUNDLINE_FORCE_MOCK` | Forces fixture-backed inference even if a model key is later present | `1` in `render.yaml` |
| `ALLOWED_ORIGINS` | Exact browser origins accepted by FastAPI CORS | Configured in Render, not committed |
| `PORT` | HTTP listen port | Supplied by Render; do not set manually |

At deployment, Render was configured with the exact origins `https://groundline.logicintelligencetechnologies.in`, `https://groundline-hackathon-2026-vikashsaravanan.vercel.app`, and `https://groundline-hackathon-2026-git-main-vikashsaravanan.vercel.app`. The custom production origin and the actual Vercel project alias both returned the matching `Access-Control-Allow-Origin`; JSON POST preflight was verified for the custom origin. No wildcard or path is used. The value is configured in Render and intentionally is not committed to the Blueprint.

## Not needed for initial MOCK service

`MODEL_API_KEY` is intentionally absent. Public LIVE requests are not enabled; the health check and MOCK fixture path are nonbillable. `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and privileged Supabase credentials are also not needed: the backend currently has no Supabase client or database operations. Do not add service-role, JWT, or secret keys as a precaution.

`BASETEN_API_KEY` is the credential name read by the optional Baseten adapter.
The adapter uses `GROUNDLINE_IMAGE_UNDERSTANDING_PROVIDER=baseten` only as
internal routing configuration; callers request the `IMAGE_UNDERSTANDING`
capability. Baseten inference has not been enabled or called. Keep any key in
Render's protected environment editor and never place it in tracked files.

The Vercel project has Supabase/Postgres environment-variable names configured, including privileged names. Their values have not been verified for Groundline and are not used by the current app source. Review and remove unused values in Vercel separately; this file does not reproduce them.

Never place provider keys in Docker build args, Dockerfile instructions, GitHub Actions, browser code, or this document.
