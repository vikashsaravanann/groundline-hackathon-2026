# Backend domain readiness

## Current service endpoint

The Render service is available at `https://groundline-api-8wqb.onrender.com`.
Its HTTPS `/healthz` returned HTTP 200 with `mode=MOCK`. A synthetic
`/api/analyze` request returned structured fixture data, zero estimated cost,
and an exposed `X-Correlation-ID` response header.

## Custom hostname

The Render service settings now list
`api.groundline.logicintelligencetechnologies.in`. DNS lookup resolves the
hostname through `groundline-api-8wqb.onrender.com` to Render infrastructure.
No DNS record was changed by this agent. An HTTPS health request from this
environment reached the IP but the TLS handshake was reset, so custom-hostname
HTTPS is not verified. The `.onrender.com` hostname remains the verified
frontend API URL. After the custom hostname's TLS endpoint responds, update
Vercel `NEXT_PUBLIC_API_BASE_URL` and verify the browser integration.

The user-provided frontend domain `groundline.logicintelligencetechnologies.in`
is attached to the existing Vercel project and Vercel reports a valid
configuration. A direct HTTPS request from this environment reset during the
TLS handshake, so end-user access is not yet independently confirmed.
