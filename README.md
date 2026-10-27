# Groundline

**Human-guided vision-to-action AI.** Groundline turns a product image and a typed goal into structured, reviewable assistance. The user stays in control of every action.

## Day 2 scope

Groundline currently supports explicit camera consent, a single camera still, image upload, typed objectives, image analysis, and reviewable result fields. The Studio does not submit forms, make purchases, or contact third parties. Voice intake is deferred; typed input is available. Grounding, browser automation, and later action-preparation stages are planned and are not represented as operational features.

## Development

Start the API in MOCK mode:

```bash
cd apps/api
python -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
GROUNDLINE_FORCE_MOCK=1 ALLOWED_ORIGINS=http://localhost:3000 \
  .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In a second terminal, start the web app:

```bash
cd apps/web
npm ci
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

Open `http://localhost:3000`. The camera starts only after the user selects **Start camera**. In MOCK mode, analysis uses a checked-in fixture and reports zero request cost.

## Quality checks

```bash
# apps/web
npm run lint
npx tsc --noEmit
npm test
npm run build

# apps/api
.venv/bin/python -m pytest -q
.venv/bin/python -m pip check
```

## Deployment configuration

The Next.js app is in `apps/web`; the FastAPI Docker build is in `apps/api`. The root `render.yaml` describes the intended Render service. Public API calls require `NEXT_PUBLIC_API_BASE_URL` at frontend build time. Keep public deployments in `GROUNDLINE_FORCE_MOCK=1` until API access controls for billable LIVE inference are implemented and reviewed. See the deployment notes in `docs/` for verified versus pending provider setup.

## Project provenance

Independent submission to the Meta Global AI Developer Hackathon 2026, Indie Developer track, theme **Build for Your World**. Built by Vikash Saravanan. This is an independent individual entry, not a company submission.

Not affiliated with, endorsed by, or sponsored by Meta Platforms or Cerebral Valley.

## License

Apache License, Version 2.0. See [LICENSE](LICENSE).
