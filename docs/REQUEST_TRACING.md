# Request tracing & observability (H08)

Every `/api/analyze` call is traced with a correlation id and one structured log
line. The correlation id is also returned to the browser as the
`X-Correlation-ID` header and shown in the UI as the Analysis ID.

## What is captured

Conceptually (see `apps/api/app/main.py`, logger `groundline.analyze`):

```ts
type AnalysisTrace = {
  correlationId: string;          // uuid4[:12]
  source: "meta-live" | "mock";   // from the response's own mode
  model: string | null;           // muse-spark-1.3
  durationMs: number;             // request elapsed
  status: "completed" | "partial" | "failed";
  inputTokens: number | null;
  outputTokens: number | null;
  errorCode: string | null;       // exception class on failure
};
```

The emitted line carries: `cid`, `mode`, `model`, reasoning `effort`,
`in_tok`/`out_tok`/`total_tok`, `status`, `objective_len`, `elapsed_ms`,
`req_cost_usd`, and a running `cum_live_cost_usd`. A failure logs `cid`,
`status=error`, `effort`, `objective_len`, `elapsed_ms`, and the exception
**class** (never its message).

## What is never logged

The API key, the image bytes, the image data URL, any audio, and any
user-supplied text. The objective's **length** is logged, not the objective.
Verified: a secret scan of the live server log returned zero
`Bearer`/`LLM_`/`MODEL_API_KEY=` hits.

## Cost accounting

Cost is derived from the response's token counts at the recorded muse-spark-1.3
pricing ($1.25 / $4.25 per M input/output). Only **live** calls accumulate into
the running total; MOCK calls add nothing. When usage is absent the UI shows
"—" rather than a fabricated price, and a MOCK result is never presented as
having incurred a charge.

## Surfacing the line

The tests capture the line via `caplog` (see
`apps/api/tests/test_analyze.py::test_trace_logs_length_not_objective_and_sets_correlation_id`).
Under the bare `uvicorn` CLI the app logger isn't printed by the default log
config; run with `--log-config` or an app-level handler to surface it in dev.
The correlation id is always visible to the client via the response header.

## Sanitized trace examples

- **MOCK success:** `cid=485fedab6076 mode=MOCK model=muse-spark-1.3 effort=minimal in_tok=132 out_tok=259 total_tok=391 status=completed objective_len=37 elapsed_ms=0 req_cost_usd=0.001266 cum_live_cost_usd=0.000000`
- **LIVE success:** correlation id `fcab5c7e-1bb`, source meta-live, 691 tokens, ~$0.00156, status completed (27 Oct 2026 verification run).
- **Validation failure:** HTTP 422 from the pydantic validators (empty/oversized objective, bad MIME, oversized/invalid image); no model call is made.
