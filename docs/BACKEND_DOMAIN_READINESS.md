# Backend domain readiness

## Current service endpoint

The Render service is available at `https://groundline-api-8wqb.onrender.com`.
Its HTTPS `/healthz` returned HTTP 200 with `mode=MOCK`. A synthetic
`/api/analyze` request returned structured fixture data, zero estimated cost,
and an exposed `X-Correlation-ID` response header.

## Custom hostname

No API custom domain has been added in Render and no DNS record has been changed.
`api.groundline.logicintelligencetechnologies.in` is only a proposed hostname;
the domain owner must confirm it and review Render's exact DNS instructions
before records are changed. After DNS and TLS resolve, update the Vercel
`NEXT_PUBLIC_API_BASE_URL` to the verified hostname and add the frontend's exact
HTTPS origin to Render's `ALLOWED_ORIGINS`.

The user-provided frontend domain `groundline.logicintelligencetechnologies.in`
is attached to the existing Vercel project and Vercel reports a valid
configuration. A direct HTTPS request from this environment reset its
connection, so end-user access is not yet independently confirmed.
