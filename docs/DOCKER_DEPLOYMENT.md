# Groundline API Docker deployment

## Image layout

The backend image is built from the repository root with `apps/api` as its context. `apps/api/Dockerfile` uses the pinned Python 3.14 slim Bookworm image, installs only pinned runtime requirements, copies the FastAPI app and MOCK fixture, and runs as UID/GID `10001`. Uvicorn binds to `0.0.0.0` and reads Render's injected `PORT` (default `10000`). A Docker health check calls `/healthz`.

`apps/api/.dockerignore` excludes `.env` files, virtual environments, caches, tests, Git metadata, frontend build output, and key/certificate files. It deliberately retains `fixtures/analyze_label.json`.

## Local verification

Build from the repository root:

```bash
docker build -f apps/api/Dockerfile -t groundline-api:local apps/api
```

Run an isolated MOCK service:

```bash
docker run --rm -p 10000:10000 \
  -e PORT=10000 \
  -e GROUNDLINE_FORCE_MOCK=1 \
  -e ALLOWED_ORIGINS=http://localhost:3000 \
  groundline-api:local
```

Then check `curl -i http://127.0.0.1:10000/healthz` and POST a synthetic request to `/api/analyze`. Do not pass a real model key to the local or public MOCK verification.

## Verified locally on 2026-10-27

- Image build succeeded after fixing the Dockerfile health-check command syntax.
- Container health endpoint returned HTTP 200 with `mode: MOCK`.
- Synthetic `/api/analyze` returned HTTP 200, three fixture facts, `mode: MOCK`, `estimated_cost_usd: 0.0`, and exposed `X-Correlation-ID`.
- Runtime user was `10001:10001`; Docker reported the health check healthy.
- Runtime image contained the fixture and did not contain `.env` or tests.
- Container was stopped and removed after verification.

This is local container evidence, not a Render deployment or external HTTPS health check.
