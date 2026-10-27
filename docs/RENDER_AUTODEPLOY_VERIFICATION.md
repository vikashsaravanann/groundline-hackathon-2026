# Render automatic deployment verification

`render.yaml` configures `autoDeployTrigger: checksPass`, and the Backend CI workflow runs on pushes and pull requests with repository-read permissions. CI does not receive `MODEL_API_KEY` and does not make live Meta requests.

## Evidence boundary

Blueprint validation proves the setting is accepted by Render's validator; it does not prove a service exists, that Render is connected to the repository, or that a GitHub check gates deployment. Those claims require an applied Blueprint and an observed GitHub-triggered Render deployment.

Initial Blueprint apply created the service and its first deployment. A later
test-only backend commit passed GitHub Backend CI and Render deployed it without
a manual trigger. A separate environment-variable update has triggered a
follow-up service restart; see the final report for its result.

| Evidence | Result |
|---|---|
| Render service and Blueprint IDs | `srv-dbg7pe6c6qcc73ek44ig`; Blueprint `exs-dbg7p6l9fdbs73d1d560` |
| Connected repository and branch | `vikashsaravanann/groundline-hackathon-2026`, `main` |
| CI check recognized by Render | Backend CI run `40489230845` succeeded before Render deployment began |
| Commit SHA and GitHub Backend CI URL | `38bc4b3e4c80946c4afc870488375d5038bfffe3`; https://github.com/vikashsaravanann/groundline-hackathon-2026/actions/runs/40489230845 |
| Render deploy ID and trigger type | `dep-dbg7rjq9lscs73928fa0`, trigger `new_commit`, status `live` |
| Post-deploy `/healthz` result | HTTPS HTTP 200, `mode=MOCK`; synthetic analysis also returned 200 with zero cost |
| Environment update restart | `dep-dbg7sinb9u1s73ch8s9g`, API triggered; in progress when last checked |

The commit deployment occurred only after the matching Backend CI run succeeded; the service is configured with `autoDeployTrigger: checksPass`. A failed-check suppression test has not been separately performed.
