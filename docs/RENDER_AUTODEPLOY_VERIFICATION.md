# Render automatic deployment verification

`render.yaml` configures `autoDeployTrigger: checksPass`, and the Backend CI workflow runs on pushes and pull requests with repository-read permissions. CI does not receive `MODEL_API_KEY` and does not make live Meta requests.

## Evidence boundary

Blueprint validation proves the setting is accepted by Render's validator; it does not prove a service exists, that Render is connected to the repository, or that a GitHub check gates deployment. Those claims require an applied Blueprint and an observed GitHub-triggered Render deployment.

Initial Blueprint apply created the service and its first deployment. That first
deployment was triggered by `blueprint_sync`, so it does not prove the CI-gated
automatic deployment path. A subsequent test-only backend commit is being used
to verify that Render waits for Backend CI and deploys after the checks pass.

Record the result of that verification here:

| Evidence | Result |
|---|---|
| Render service and Blueprint IDs | `srv-dbg7pe6c6qcc73ek44ig`; Blueprint `exs-dbg7p6l9fdbs73d1d560` |
| Connected repository and branch | `vikashsaravanann/groundline-hackathon-2026`, `main` |
| CI check recognized by Render | Pending backend proof commit |
| Commit SHA and GitHub Backend CI URL | Pending backend proof commit |
| Render deploy ID and trigger type | Initial deploy `dep-dbg7peuc6qcc73ek47sg`, trigger `blueprint_sync`; automatic proof pending |
| Post-deploy `/healthz` result | Initial HTTPS check returned HTTP 200 and `mode=MOCK`; automatic proof pending |

Do not describe automatic CI-gated deployment as verified until a successful backend commit passes CI and Render deploys it without a manual deploy action. A failed-check suppression test is not performed by CI unless a controlled nonproduction test is separately authorized.
