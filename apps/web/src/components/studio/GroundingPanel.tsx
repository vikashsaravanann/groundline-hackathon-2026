"use client";

import { useMemo, useState } from "react";
import { Crosshair, LoaderCircle, RotateCcw, ShieldCheck } from "lucide-react";

import { Button } from "@/components/design/Button";
import { MockLiveBadge } from "@/components/design/MockLiveBadge";
import { StatusPill } from "@/components/design/StatusPill";
import type { Studio } from "@/hooks/useStudio";
import { GROUNDING_LIVE_PREVIEW_ENABLED } from "@/lib/config";
import { GroundingError } from "./GroundingError";

export function GroundingPanel({ studio }: { studio: Studio }) {
  const { image, result, groundingStatus, groundingResult, groundingError } = studio;
  const [accessCode, setAccessCode] = useState("");
  const [confirmation, setConfirmation] = useState<{ resultKey: string; objectId: string } | null>(null);
  const resultKey = groundingResult
    ? `${groundingResult.imageSha256}:${groundingResult.targetPhrase}:${groundingResult.responseId ?? groundingResult.correlationId}`
    : "";

  const selected = useMemo(
    () => groundingResult?.objects.find((object) => object.objectId === studio.selectedGroundingObjectId) ?? null,
    [groundingResult, studio.selectedGroundingObjectId],
  );
  if (!image || !result) return null;

  const inProgress = groundingStatus === "grounding";
  const targetReady = studio.targetPhrase.trim().length > 0;
  const canGround = targetReady && !inProgress;
  const statusLabel = groundingStatus === "no-match"
    ? "No match"
    : groundingStatus === "mock-unavailable"
      ? "Fixture unavailable"
      : groundingStatus === "completed"
        ? `${groundingResult?.objects.length ?? 0} object${groundingResult?.objects.length === 1 ? "" : "s"}`
        : null;

  return (
    <section aria-label="Visual grounding" aria-live="polite" className="glass-panel flex flex-col gap-5 rounded-[28px] p-5 sm:p-6">
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-light text-purple-accent">
          <Crosshair className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold text-ink">Ground a visible object</h2>
        <p className="max-w-xl text-sm leading-relaxed text-ink-soft">
          Choose one short object name and submit it explicitly. Public production stays forced to MOCK; restricted live requests require separate server-side authorization and shared quotas.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          <GroundingOverlay imageUrl={image.dataUrl} width={image.width} height={image.height} objects={groundingResult?.objects ?? []} selectedId={selected?.objectId ?? null} />
          <p className="text-center text-xs text-muted">Outlined regions come from the returned geometry. A mask is shown only when the parser validated one.</p>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="ground-target" className="text-sm font-semibold text-ink">Re-select target</label>
            <input
              id="ground-target"
              value={studio.targetPhrase}
              onChange={(event) => {
                studio.setTargetPhrase(event.target.value);
                setConfirmation(null);
              }}
              maxLength={80}
              placeholder="For example, desk lamp"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus-visible:border-blue-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-accent/30"
            />
            <p className="text-xs leading-relaxed text-muted">Change the phrase to choose a different visible target. Groundline sends it only when you submit the grounding request.</p>
          </div>

          {GROUNDING_LIVE_PREVIEW_ENABLED && <details className="rounded-2xl border border-line/70 bg-white/60 p-4">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-accent">
              <ShieldCheck className="h-4 w-4 text-navy" aria-hidden="true" />
              Restricted live-preview access
            </summary>
            <label htmlFor="ground-access-code" className="mt-3 block text-xs text-ink-soft">Test access code (session only)</label>
            <input
              id="ground-access-code"
              type="password"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              autoComplete="off"
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-accent"
            />
            <p className="mt-2 text-xs leading-relaxed text-muted">This is a restricted demo access code, not a Meta API key. It is not stored. Public production remains forced to MOCK.</p>
          </details>}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void studio.ground(accessCode || undefined)} disabled={!canGround}>
              {inProgress ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Crosshair className="h-4 w-4" aria-hidden="true" />}
              {inProgress ? "Grounding…" : "Find this target"}
            </Button>
            {inProgress && <Button variant="secondary" onClick={studio.cancelGrounding}>Cancel</Button>}
            {groundingResult && <Button variant="ghost" onClick={studio.clearGrounding}><RotateCcw className="h-4 w-4" />Clear result</Button>}
            {statusLabel && <StatusPill tone={groundingResult?.mode === "live" ? "live" : "mock"}>{statusLabel}</StatusPill>}
            {groundingResult && <MockLiveBadge source={groundingResult.mode === "live" ? "meta-live" : "mock"} />}
          </div>

          {groundingStatus === "ready" && <p className="text-xs text-muted">Grounding has not been submitted yet.</p>}
          {inProgress && <p role="status" className="text-sm text-ink-soft">Waiting for the bounded grounding response. Public requests use MOCK; an explicitly configured restricted LIVE request may use model credit.</p>}
          {groundingStatus === "no-match" && <p role="status" className="rounded-2xl bg-cloud p-4 text-sm text-ink-soft">No matching object was found. Try a more specific description or select another target.</p>}
          {groundingStatus === "mock-unavailable" && <p role="status" className="rounded-2xl bg-purple-light/40 p-4 text-sm text-ink-soft">This public service is in MOCK mode. Its sample mask is available only for the matching synthetic desk-lamp scene; no live detection was made for this image.</p>}
          {groundingError && <GroundingError error={groundingError} />}

          {groundingResult && groundingResult.objects.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">Detected regions</h3>
              </div>
              <ul className="flex flex-col gap-2" aria-label="Grounded objects">
                {groundingResult.objects.map((object) => (
                  <li key={object.objectId}>
                    <button
                      type="button"
                      aria-pressed={selected?.objectId === object.objectId}
                      onClick={() => { studio.selectGroundingObject(object.objectId); setConfirmation(null); }}
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-accent ${selected?.objectId === object.objectId ? "border-navy bg-blue-light/45" : "border-line bg-white/70 hover:bg-white"}`}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">{object.label}</span>
                        <span className="block text-xs text-muted">Object ID {object.objectId} · {object.mask ? "validated segmentation mask" : "box only"}</span>
                      </span>
                      <span className="shrink-0 text-xs text-ink-soft">{object.score === null ? "Score not provided" : `Score ${(object.score * 100).toFixed(1)}%`}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-xs leading-relaxed text-muted">SAM identifies a region; it does not prove that every extracted text field came from that region. Check the image and result separately.</p>
              {selected && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setConfirmation({ resultKey, objectId: selected.objectId })}>Confirm selected region</Button>
                  <Button size="sm" variant="ghost" onClick={() => { studio.selectGroundingObject(null); setConfirmation(null); }}>Reject selection</Button>
                  {confirmation?.resultKey === resultKey && confirmation.objectId === selected.objectId && <StatusPill tone="success">Confirmed for this review</StatusPill>}
                </div>
              )}
              <dl className="grid grid-cols-2 gap-3 border-t border-line pt-3 text-xs text-muted">
                <div><dt>Source image</dt><dd className="mt-1 break-all font-mono">SHA-256 {groundingResult.imageSha256.slice(0, 16)}…</dd></div>
                <div><dt>Estimated cost</dt><dd className="mt-1 text-ink-soft">{groundingResult.mode === "MOCK" ? "$0.00000 · MOCK" : `$${groundingResult.estimatedCostUsd.toFixed(5)} · estimate`}</dd></div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function GroundingOverlay({
  imageUrl,
  width,
  height,
  objects,
  selectedId,
}: {
  imageUrl: string;
  width: number;
  height: number;
  objects: NonNullable<Studio["groundingResult"]>["objects"];
  selectedId: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white/70 p-2">
      <div className="relative mx-auto w-fit max-w-full">
        {/* The image keeps its natural aspect ratio. The SVG viewBox uses the same source dimensions. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Source image with grounded object overlay" width={width} height={height} className="block h-auto max-h-[70vh] max-w-full w-auto rounded-xl object-contain" />
        <svg aria-hidden="true" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          {objects.map((object) => {
            const selected = object.objectId === selectedId;
            return (
              <g key={object.objectId}>
                {object.mask && (
                  <path
                    d={object.mask.path}
                    transform={`translate(${object.mask.bounds.x * width} ${object.mask.bounds.y * height}) scale(${object.mask.bounds.width * width / object.mask.width} ${object.mask.bounds.height * height / object.mask.height})`}
                    fill={selected ? "rgba(91,75,146,0.42)" : "rgba(91,75,146,0.2)"}
                    stroke={selected ? "#5b4b92" : "#ffffff"}
                    strokeWidth={selected ? Math.max(2, width / 350) : Math.max(1, width / 700)}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                <rect x={object.box.x * width} y={object.box.y * height} width={object.box.width * width} height={object.box.height * height} fill="none" stroke={selected ? "#182f4d" : "#5b4b92"} strokeWidth={selected ? Math.max(3, width / 250) : Math.max(2, width / 400)} vectorEffect="non-scaling-stroke" />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
