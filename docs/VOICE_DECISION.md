# Voice intake — decision (H07)

**Decision: DEFERRED.** Voice is secondary to the working typed-image workflow
and does not block it. The typed objective field is fully functional and is the
primary intake path. No microphone button is shown, so nothing implies working
transcription that does not exist. (Supersedes the earlier `VOICE_NOTE.md`.)

## Why defer

- The end-of-day bar — a typed image request that runs repeatably with friendly
  error handling — is met (and LIVE image understanding is now verified).
- Robust browser audio capture requires format conversion that is not yet built
  (see Audio contract). Shipping a half-working mic button would violate the
  project's honesty rule.

## Official capability (for the future adapter)

- Model: `muse-voice-transcribe-1.0` (speech-to-text, not synthesis).
- File endpoint: `POST https://api.meta.ai/v1/asr/transcribe` (multipart).
- Realtime endpoint: `wss://api.meta.ai/v1/asr/realtime`.

## Planned push-to-talk flow

1. User explicitly starts recording (mic permission requested only then —
   image capture never requests the microphone).
2. Visible recording indicator; stop / cancel controls.
3. Audio validated, converted to a supported format if needed.
4. Backend sends the audio to Meta through protected credentials (no key in the
   browser), mirroring the adapter's discipline (timeout, one retry, MOCK/live
   switch, rule-7 labelling, correlation id).
5. The transcript populates the **same** objective field; the user reviews and
   edits it, then **separately** presses Analyze (no auto-analysis).

## Audio contract (confirm against docs before building)

The file endpoint expects mono, 16-bit PCM WAV at a supported sample rate
(e.g. 16 or 24 kHz), sent as multipart. Browser `MediaRecorder` does not emit
compatible WAV automatically, so a controlled client-side conversion (or a
backend transcode) is required.

## Privacy

Audio is captured only on explicit action, never streamed continuously, and
never logged (only its byte length / duration would be traced). Synthetic
speech only for demos.

## Planned acceptance tests

- No mic permission requested before user action.
- Record → stop → transcript populates the field (fixture first).
- Transcript is editable; Analyze is a separate explicit step.
- No audio bytes or transcript text in logs.

## Fallback status

Typed input is implemented, tested, and is the supported path today.
