# Render Blueprint

`render.yaml` at the repository root declares one service, `groundline-api`, from the GitHub repository `vikashsaravanann/groundline-hackathon-2026` on `main`.

| Setting | Blueprint value |
|---|---|
| Runtime | Docker |
| Dockerfile | `./apps/api/Dockerfile` |
| Docker context | `./apps/api` |
| Plan | Free (only if Render offers it for this service) |
| Region | Singapore |
| Health check | `/healthz` |
| Automatic deploy trigger | `checksPass` |
| Build filter | Backend code, Blueprint, Backend CI workflow |
| Initial mode | `GROUNDLINE_FORCE_MOCK=1` |

The Blueprint does not create a database, Redis instance, worker, cron job, or paid preview environment. `ALLOWED_ORIGINS` is declared `sync: false` because its exact production value must be supplied by the project owner during initial sync. No Meta or Supabase secret is included.

## Validation and current status

On 2026-10-27, Render CLI `2.28.0` validated `render.yaml` against the authenticated **My Workspace**. The validation result was `valid: true` and a plan for one service creation. Validation does not apply the Blueprint. See `DEPLOYMENT_FINAL_REPORT.md` for the current apply/deployment state.

## First apply

The first synchronization must be reviewed in Render's Blueprint flow. Confirm the correct GitHub repository, `main`, exactly one Docker web service, Free plan availability, Singapore region, `/healthz`, and `checksPass`. Stop if Render proposes any extra or paid resource. Do not create a parallel service outside this Blueprint.
