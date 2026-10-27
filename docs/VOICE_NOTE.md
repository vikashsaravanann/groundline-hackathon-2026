# H07 — Voice intake: approach note and cut decision

**Status: DEFERRED (cut candidate).** Per the handbook, voice "can be deferred
and will not block Day 3." If we are behind, H07 is the first thing to drop.
The end-of-day bar is a typed image request that runs repeatably with friendly
error handling — that is met by the text objective field plus `/api/analyze` in
MOCK. Voice is additive, not on the critical path.

This note records the intended approach so picking it back up is cheap. It is
written without live access to the Muse Voice Transcribe docs (auth-gated), so
the request/response shape below is **UNVERIFIED** and must be confirmed against
the real docs before any live call — exactly as we verified the Muse Spark
`/responses` shape on Day 1.

## What we already know (verified Day 1)

- Base URL `https://api.meta.ai/v1`, bearer auth with `MODEL_API_KEY`
  (keys start `LLM_`). The transcription endpoint is expected to live under the
  same base and auth; confirm the exact path from the docs.
- The backend holds every credential (SECURITY.md rule 1). Audio, like images,
  is captured in the browser and sent to our FastAPI backend, which calls Meta.
  No key reaches the browser.

## Intended approach (confirm against docs before building)

1. **Capture** — reuse the consent-gated pattern from the camera flow: an
   explicit "Start recording" / "Stop" control, never auto-listening. Record a
   short clip with `MediaRecorder` (`audio/webm` or `audio/mp4`), enforce a
   duration and byte ceiling in the browser, and only send on an explicit stop.
2. **Transport** — new backend entry point alongside `call_model`, e.g.
   `transcribe(audio_bytes, mime)`, mirroring the adapter's discipline: hard
   timeout, at most one retry, `MODEL_API_KEY` never logged/returned, and the
   same MOCK/live switch (a recorded transcription fixture + `mode="MOCK"` when
   no key or `GROUNDLINE_FORCE_MOCK=1`). Rule 7 applies: a mocked transcript
   announces itself.
3. **Endpoint** — `POST /api/transcribe` returning `{ text, mode }`. The
   transcript then populates the same objective field that typed intake uses, so
   the downstream `/api/analyze` path is unchanged.
4. **Tracing** — same correlation-ID + token/cost log line as `/api/analyze`;
   log the audio's byte length and duration, never the audio bytes or the
   transcript text.

## Open questions for the docs

- Exact endpoint path and whether audio is sent as multipart, a base64 field,
  or a signed upload.
- Model id for transcription and its pricing (so the cost accumulator covers it).
- Supported audio MIME types and any size/duration limits.
- Whether transcription uses the same `/responses` typed-output envelope or a
  dedicated schema.

## Recording budget

When built, record **exactly one** real transcription to a fixture (as with the
Spark fixture), then develop offline against it. No live calls in tests or CI.
