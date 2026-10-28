# Security rules for this project

1. No credential ever reaches the browser. The backend holds every key.
2. No API key, token or password enters an agent chat context, a commit, a log,
   a screenshot or a Discord message.
3. The browser agent runs against a static domain allowlist. No arbitrary URLs.
4. No payment, no account creation, no real form submission, ever — not even
   behind a feature flag.
5. Every consequential action requires an unexpired human approval bound to the
   exact action hash, and is written to an immutable audit log.
6. Synthetic data only. No real bill, prescription, identity document, medical
   artefact, or photograph of a real person passes through the API. While free
   credits are in use, Meta states content may be used for product improvement.
7. A mocked path must announce itself as MOCK and must never be presented as a
   live model call.
8. Medical-document interpretation and electrical-wiring repair guidance are
   out of scope. The analyze endpoint returns a designed refusal before model
   routing and states that the request was not sent to an AI provider. This
   refusal does not permit uploading real medical records or other sensitive
   material; synthetic data only remains in force.
