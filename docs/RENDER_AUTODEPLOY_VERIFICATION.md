# Render automatic deployment verification

`render.yaml` configures `autoDeployTrigger: checksPass`, and the Backend CI workflow runs on pushes and pull requests with repository-read permissions. CI does not receive `MODEL_API_KEY` and does not make live Meta requests.

## Evidence boundary

Blueprint validation proves the setting is accepted by Render's validator; it does not prove a service exists, that Render is connected to the repository, or that a GitHub check gates deployment. Those claims require an applied Blueprint and an observed GitHub-triggered Render deployment.

Record each verified run here after service creation:

| Evidence | Result |
|---|---|
| Render service and Blueprint IDs | Pending initial apply |
| Connected repository and branch | Pending initial apply |
| CI check recognized by Render | Pending first deployment |
| Commit SHA and GitHub Backend CI URL | Pending proof run |
| Render deploy ID and trigger type | Pending proof run |
| Post-deploy `/healthz` result | Pending proof run |

Do not describe automatic CI-gated deployment as verified until a successful backend commit passes CI and Render deploys it without a manual deploy action. A failed-check suppression test is not performed by CI unless a controlled nonproduction test is separately authorized.
