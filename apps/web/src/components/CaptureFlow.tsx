"use client";

import { useCaptureMachine, type Seed } from "@/hooks/useCaptureMachine";
import { MAX_OBJECTIVE_CHARS } from "@/lib/config";
import { CAPTURE_STATES, type CaptureState } from "@/lib/types";
import { MockBadge } from "./MockBadge";

const STATE_LABEL: Record<CaptureState, string> = {
  idle: "Idle",
  "requesting-permission": "Requesting permission",
  ready: "Ready",
  capturing: "Captured",
  uploading: "Uploading",
  analyzing: "Analyzing",
  result: "Result",
  error: "Error",
};

const btnBase =
  "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold " +
  "transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-40";
const btnPrimary = `${btnBase} bg-sky-500 text-white hover:bg-sky-400 focus-visible:ring-sky-400`;
const btnDanger = `${btnBase} bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-400`;
const btnGhost = `${btnBase} bg-slate-800 text-slate-100 hover:bg-slate-700 focus-visible:ring-slate-400`;

function Stepper({ current }: { current: CaptureState }) {
  return (
    <ol className="flex flex-wrap gap-1.5" aria-label="Capture progress">
      {CAPTURE_STATES.map((s) => {
        const active = s === current;
        return (
          <li
            key={s}
            aria-current={active ? "step" : undefined}
            className={
              "rounded-md px-2 py-1 text-[11px] font-medium " +
              (active
                ? s === "error"
                  ? "bg-rose-500 text-white"
                  : "bg-sky-500 text-white"
                : "bg-slate-800 text-slate-400")
            }
          >
            {STATE_LABEL[s]}
          </li>
        );
      })}
    </ol>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-5 w-5 animate-spin rounded-full border-2 border-slate-500 border-t-sky-400"
    />
  );
}

export default function CaptureFlow({ seed }: { seed?: Seed }) {
  const {
    state,
    snapshot,
    result,
    error,
    objective,
    isPreview,
    setObjective,
    videoRef,
    startCamera,
    stopCamera,
    capture,
    analyze,
    retake,
    reset,
  } = useCaptureMachine(seed);

  const remaining = MAX_OBJECTIVE_CHARS - objective.length;
  const objectiveValid = objective.trim().length > 0 && remaining >= 0;

  // Only the live feed shows the <video>; requesting-permission shows a spinner.
  // The element is always mounted (toggled via a class), so its ref is stable.
  const showVideo = state === "ready";
  const showPreview =
    snapshot !== null &&
    (state === "capturing" || state === "uploading" || state === "analyzing");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-8 text-slate-100">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Groundline</h1>
          {result && <MockBadge mode={result.mode} />}
        </div>
        <p className="text-sm text-slate-400">
          Point the camera at a label, state your goal, and capture one still. Nothing
          is sent until you press Analyze.
        </p>
        {isPreview && (
          <p className="rounded-md bg-slate-800 px-3 py-1.5 text-xs text-amber-300">
            Dev state preview — rendering the <strong>{state}</strong> state with sample
            data (no camera, no backend call).
          </p>
        )}
      </header>

      <Stepper current={state} />

      <section aria-live="polite" className="sr-only">
        Current state: {STATE_LABEL[state]}
      </section>

      {/* Objective */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="objective" className="text-sm font-medium text-slate-300">
          Objective
        </label>
        <textarea
          id="objective"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          maxLength={MAX_OBJECTIVE_CHARS + 50}
          rows={2}
          placeholder="e.g. log this product's name, size and best-before date"
          className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-sky-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
        />
        <div
          className={
            "self-end text-xs " + (remaining < 0 ? "text-rose-400" : "text-slate-500")
          }
        >
          {remaining} characters left
        </div>
      </div>

      {/* Viewport */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
        {/* The video element is always mounted so its ref is stable. */}
        <video
          ref={videoRef}
          playsInline
          muted
          aria-label="Live camera preview"
          className={"h-full w-full object-cover " + (showVideo ? "block" : "hidden")}
        />
        {showPreview && snapshot && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={snapshot.dataUrl}
            alt="Captured still awaiting analysis"
            className="absolute inset-0 h-full w-full object-contain"
          />
        )}
        {!showVideo && !showPreview && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
            {state === "requesting-permission" ||
            state === "uploading" ||
            state === "analyzing" ? (
              <>
                <Spinner />
                <p className="text-sm text-slate-400">
                  {state === "requesting-permission" &&
                    "Waiting for you to allow camera access…"}
                  {state === "uploading" && "Uploading the still…"}
                  {state === "analyzing" && "Grounding the visible facts…"}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                {state === "error"
                  ? "Camera stopped."
                  : state === "result"
                    ? "Analysis complete."
                    : "The camera is off. Press Start camera to begin."}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        {state === "idle" && (
          <button className={btnPrimary} onClick={startCamera}>
            Start camera
          </button>
        )}

        {state === "requesting-permission" && (
          <button className={btnGhost} disabled>
            Requesting permission…
          </button>
        )}

        {state === "ready" && (
          <>
            <button className={btnPrimary} onClick={capture}>
              Capture snapshot
            </button>
            <button className={btnDanger} onClick={stopCamera}>
              Stop camera
            </button>
          </>
        )}

        {state === "capturing" && (
          <>
            <button
              className={btnPrimary}
              onClick={analyze}
              disabled={!objectiveValid || !snapshot?.base64}
              title={objectiveValid ? undefined : "Enter an objective first"}
            >
              Analyze
            </button>
            <button className={btnGhost} onClick={retake}>
              Retake
            </button>
            <button className={btnDanger} onClick={stopCamera}>
              Stop camera
            </button>
          </>
        )}

        {(state === "uploading" || state === "analyzing") && (
          <button className={btnGhost} disabled>
            {state === "uploading" ? "Uploading…" : "Analyzing…"}
          </button>
        )}

        {state === "result" && (
          <>
            <button className={btnPrimary} onClick={retake}>
              New capture
            </button>
            <button className={btnDanger} onClick={stopCamera}>
              Stop camera
            </button>
          </>
        )}

        {state === "error" && (
          <>
            <button className={btnPrimary} onClick={startCamera}>
              Try again
            </button>
            <button className={btnGhost} onClick={reset}>
              Reset
            </button>
          </>
        )}
      </div>

      {/* Error panel */}
      {state === "error" && error && (
        <div
          role="alert"
          className="flex flex-col gap-1 rounded-xl border border-rose-700 bg-rose-950/50 p-4"
        >
          <p className="font-semibold text-rose-200">{error.message}</p>
          <p className="text-sm text-rose-300/80">{error.hint}</p>
        </div>
      )}

      {/* Result panel */}
      {state === "result" && result && (
        <div className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-900 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Visible facts</h2>
            <MockBadge mode={result.mode} />
          </div>

          <ul className="flex flex-col divide-y divide-slate-800">
            {result.facts.map((f, i) => (
              <li key={i} className="flex flex-col gap-1 py-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    {f.label}
                  </span>
                  <span className="text-xs text-slate-500">
                    {Math.round(f.confidence * 100)}%
                  </span>
                </div>
                <span className="text-sm text-slate-100">{f.value}</span>
                <div className="h-1 w-full rounded bg-slate-800">
                  <div
                    className="h-1 rounded bg-sky-400"
                    style={{ width: `${Math.round(f.confidence * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400 sm:grid-cols-4">
            <div>
              <dt className="text-slate-500">Model</dt>
              <dd className="text-slate-200">{result.model}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Overall</dt>
              <dd className="text-slate-200">
                {Math.round(result.overall_confidence * 100)}%
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Tokens</dt>
              <dd className="text-slate-200">{result.usage.total_tokens}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Est. cost</dt>
              <dd className="text-slate-200">
                ${result.usage.estimated_cost_usd.toFixed(5)}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </main>
  );
}
