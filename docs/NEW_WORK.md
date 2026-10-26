# New work provenance

All code in this repository was written between 26 October and 4 November 2026
for the Meta Global AI Developer Hackathon. Nothing here predates the event.

## Accounts and identifiers

| Thing | Value |
|---|---|
| GitHub | vikashsaravanann  (double n) |
| Vercel scope | vikashsaravanan  (single n) |
| Meta Model API team | 2639715836462932 |
| Modal workspace | createwithvikash |

## Day 1 — 26 October 2026

- Meta Model API account created; $150 credits claimed and applied the same evening.
- First live call to muse-spark-1.3 verified: HTTP 200, status completed, error null.
  Defaults observed and to be overridden in our adapter:
    - reasoning.effort = high  (253 of 263 output tokens were reasoning tokens)
    - store = true
  Response shape is output[] of typed items, not choices[0].message.content.
- Partner credit requests submitted: Baseten, Modal, Fireworks.
- Repository initialised; identity pinned repo-locally.

### Day 1 close — 26 Oct 2026, 14:00–23:15 IST

- Hours completed: H01–H10 (all ten).
- Commits: f9670de (init), 44f6580 (health endpoint + leak test).
- Evidence: `python -m pytest -q` → 2 passed. `GET /healthz` → 200,
  mode "MOCK" with no key exported.
- Model spend: one verified call, muse-spark-1.3, ~$0.10 of $150.
- Blockers recorded, not hidden: Axis standing-instruction decline on the
  MasterCard required switching to a Visa before the account cleared.
  Partner credits (Baseten, Modal, Fireworks) requested, all pending review.
- Next: Day 2, camera capture and text/voice intake. Build the Meta adapter
  with reasoning.effort set explicitly and store=false. Attend Agents 101.
