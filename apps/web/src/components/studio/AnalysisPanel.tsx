"use client";

import { AlertTriangle, RotateCcw, Sparkles } from "lucide-react";

import { Button } from "@/components/design/Button";
import { MockLiveBadge } from "@/components/design/MockLiveBadge";
import { StatusPill } from "@/components/design/StatusPill";
import type { Studio } from "@/hooks/useStudio";
import { AnalysisError } from "./AnalysisError";
import { ExtractedFieldCard } from "./ExtractedFieldCard";
import { FuturePhases } from "./FuturePhases";

export function AnalysisPanel({ studio }: { studio: Studio }) {
  const { status, result, error, image } = studio;
  const analyzing = status === "analyzing";
  const showError = status === "error" && image !== null && error !== null;
  const showResult = status === "completed" && result !== null;

  return (
    <section
      aria-label="AI analysis"
      aria-live="polite"
      className="glass-panel flex min-h-[420px] flex-col gap-4 rounded-[28px] p-5 sm:p-6"
    >
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        <h2 className="text-base font-semibold text-ink">AI analysis</h2>
        {showResult && result.source !== "unavailable" && <MockLiveBadge source={result.source} />}
      </div>

      {analyzing && <LoadingState />}

      {showError && <AnalysisError error={error} onRetry={studio.analyze} />}

      {showResult && result.status === "refused" && (
        <div role="status" className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-cloud/70 p-6 text-center">
          <h3 className="text-base font-semibold text-ink">Request outside Groundline&apos;s scope</h3>
          <p className="max-w-lg text-sm leading-relaxed text-ink-soft">{result.refusalMessage ?? result.summary}</p>
        </div>
      )}

      {showResult && result.status !== "refused" && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-sm leading-relaxed text-ink">{result.summary}</p>
            {result.detectedObject && (
              <StatusPill tone="blue" className="w-fit">
                Detected: {result.detectedObject}
              </StatusPill>
            )}
          </div>

          {result.correctionEvents.length > 0 && (
            <section aria-label="Human correction audit" className="flex flex-col gap-3 rounded-2xl border border-blue-accent/20 bg-blue-light/35 p-4">
              <div>
                <h3 className="text-sm font-semibold text-ink">Human correction history</h3>
                <p className="mt-1 text-xs text-ink-soft">The original model value and each saved human correction are kept together for this analysis.</p>
              </div>
              <ol className="flex flex-col gap-2">
                {result.correctionEvents.map((event) => (
                  <li key={event.id} className="rounded-xl border border-white/80 bg-white/80 p-3 text-sm">
                    <p className="font-semibold text-ink">{event.label}</p>
                    <p className="mt-1 text-ink-soft">
                      Model said: <span className="font-medium text-ink">{event.originalValue ?? "Not readable"}</span>
                    </p>
                    <p className="text-ink-soft">
                      Human changed it to: <span className="font-medium text-ink">{event.correctedValue || "Blank"}</span>
                    </p>
                    <time dateTime={event.timestamp} className="mt-1 block text-xs text-muted">
                      {new Date(event.timestamp).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-ink">Extracted information</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {result.fields.map((f) => (
                <ExtractedFieldCard
                  key={f.id}
                  field={f}
                  onConfirm={studio.confirmField}
                  onEdit={studio.editField}
                />
              ))}
            </div>
          </div>

          {result.cautions.length > 0 && (
            <div className="flex flex-col gap-1 rounded-2xl bg-gold-light/70 p-3">
              {result.cautions.map((c, i) => (
                <p key={i} className="inline-flex items-center gap-2 text-xs text-warning">
                  <AlertTriangle className="h-3.5 w-3.5" /> {c}
                </p>
              ))}
            </div>
          )}

          <FuturePhases />

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-4 text-xs text-muted sm:grid-cols-4">
            <Meta label="Source">{result.model ?? "—"}</Meta>
            <Meta label="Analysis ID">
              <span className="font-mono">{result.analysisId}</span>
            </Meta>
            <Meta label="Tokens">{result.usage ? result.usage.totalTokens : "—"}</Meta>
            <Meta label="Est. cost">
              {result.usage ? `$${result.usage.estimatedCostUsd.toFixed(5)}` : "—"}
            </Meta>
          </dl>

          <Button variant="secondary" size="sm" onClick={studio.reset} className="w-fit">
            <RotateCcw className="h-4 w-4" />
            New analysis
          </Button>
        </div>
      )}

      {!analyzing && !showError && !showResult && <EmptyState />}
    </section>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-ink-soft">{children}</dd>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-white/40 p-8 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-light text-purple-accent">
        <Sparkles className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-ink">Your analysis will appear here.</p>
      <p className="max-w-sm text-xs text-muted">
        Capture or upload an image, describe your goal, and Groundline will help
        identify the relevant details.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-blue-accent" />
        <p className="text-sm font-medium text-ink-soft">Groundline is reading your image…</p>
      </div>
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 overflow-hidden rounded-2xl border border-line bg-white">
            <div className="h-full w-full shimmer" />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">
        Sending the still to the backend and waiting for the model to respond.
      </p>
    </div>
  );
}
