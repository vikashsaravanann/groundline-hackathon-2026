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
  const canGround = !inProgress;
  const statusLabel = groundingStatus === "no-match"
    ? "No match"
    : groundingStatus === "mock-unavailable"
      ? "Fixture unavailable"
        : groundingStatus === "multiple-candidates"
          ? `${groundingResult?.objects.length ?? 0} candidates — select one`
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
          <GroundingOverlay
            imageUrl={image.dataUrl}
            width={image.width}
            height={image.height}
            objects={groundingResult?.objects ?? []}
            selectedId={selected?.objectId ?? null}
            labelRegion={groundingResult?.labelRegion ?? null}
            fieldRegion={groundingResult?.fieldRegion ?? null}
          />
          <p className="text-center text-xs text-muted">Outlined regions come from the returned geometry. A mask is shown only when the parser validated one.</p>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="rounded-2xl border border-line bg-white/70 p-4">
            <p className="text-sm font-semibold text-ink">Stage 1 target</p>
            <p className="mt-1 text-sm text-ink-soft">white rectangle</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">This verified visual prompt locates the product label. Spark then examines only that returned crop for the model-number field.</p>
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
          {groundingStatus === "multiple-candidates" && <p role="status" className="rounded-2xl bg-cloud p-4 text-sm text-ink-soft">Multiple candidates were found. Choose the intended region below; no candidate is highlighted on the capture until you select one.</p>}
          {groundingStatus === "mock-unavailable" && <p role="status" className="rounded-2xl bg-purple-light/40 p-4 text-sm text-ink-soft">This public service is in MOCK mode. Its sample mask is available only for the matching synthetic desk-lamp scene; no live detection was made for this image.</p>}
          {groundingResult?.labelRegion && groundingResult.fieldRegion && (
            <div className="rounded-2xl border border-line bg-white/80 p-4 text-sm">
              <p className="font-semibold text-ink">Primary highlight · {groundingResult.fieldRegion.fieldName ?? "Model-number field"}</p>
              <p className="mt-1 text-ink-soft">{groundingResult.fieldRegion.value ?? "Field position found"} · {groundingResult.fieldRegion.sourceModel} · confidence {groundingResult.fieldRegion.confidence === null ? "not provided" : `${Math.round(groundingResult.fieldRegion.confidence * 100)}%`}</p>
              <p className="mt-2 text-xs text-muted">Faint context outline · product label · {groundingResult.labelRegion.sourceModel} · confidence {groundingResult.labelRegion.confidence === null ? "not provided" : `${Math.round(groundingResult.labelRegion.confidence * 100)}%`}</p>
            </div>
          )}
          {groundingResult?.labelRegion && !groundingResult.fieldRegion && (
            <p role="status" className="rounded-2xl bg-cloud p-4 text-sm text-ink-soft">
              Showing the SAM product-label region only. The model-number position was {groundingResult.fieldStatus === "no_position" ? "not returned" : "unavailable"}; no field box was drawn.
            </p>
          )}
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
                <div><dt>Stage usage</dt><dd className="mt-1 text-ink-soft">SAM {groundingResult.samUsage.totalTokens} tokens · Spark {groundingResult.sparkUsage?.totalTokens ?? 0} tokens{groundingResult.mode === "MOCK" ? " · MOCK fixture" : ""}</dd></div>
                <div><dt>Estimated cost</dt><dd className="mt-1 text-ink-soft">{groundingResult.mode === "MOCK" ? "$0.00000 · MOCK" : groundingResult.estimatedCostUsd === null ? "Unknown · provider completion uncertain" : `$${groundingResult.estimatedCostUsd.toFixed(5)} · estimate`}</dd></div>
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
  labelRegion,
  fieldRegion,
}: {
  imageUrl: string;
  width: number;
  height: number;
  objects: NonNullable<Studio["groundingResult"]>["objects"];
  selectedId: string | null;
  labelRegion: NonNullable<Studio["groundingResult"]>["labelRegion"];
  fieldRegion: NonNullable<Studio["groundingResult"]>["fieldRegion"];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white/70 p-2">
      <div className="relative mx-auto w-fit max-w-full">
        {/* The image keeps its natural aspect ratio. The SVG viewBox uses the same source dimensions. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Source image with grounded object overlay" width={width} height={height} className="block h-auto max-h-[70vh] max-w-full w-auto rounded-xl object-contain" />
        <svg aria-hidden="true" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          {!labelRegion && objects.map((object) => {
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
          {labelRegion && (
            <g data-region-source={labelRegion.sourceModel}>
              {labelRegion.mask && (
                <path
                  d={labelRegion.mask.path}
                  transform={`translate(${labelRegion.mask.bounds.x * width} ${labelRegion.mask.bounds.y * height}) scale(${labelRegion.mask.bounds.width * width / labelRegion.mask.width} ${labelRegion.mask.bounds.height * height / labelRegion.mask.height})`}
                  fill="rgba(115, 139, 166, 0.07)"
                  stroke="rgba(73, 96, 123, 0.48)"
                  strokeWidth={Math.max(1.5, width / 500)}
                  strokeDasharray="8 6"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              <rect
                x={labelRegion.box.x * width}
                y={labelRegion.box.y * height}
                width={labelRegion.box.width * width}
                height={labelRegion.box.height * height}
                fill="none"
                stroke="rgba(73, 96, 123, 0.58)"
                strokeWidth={Math.max(1.5, width / 500)}
                strokeDasharray="9 7"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          )}
          {fieldRegion && (
            <g data-region-source={fieldRegion.sourceModel}>
              <rect
                x={fieldRegion.box.x * width}
                y={fieldRegion.box.y * height}
                width={fieldRegion.box.width * width}
                height={fieldRegion.box.height * height}
                fill="rgba(64, 126, 180, 0.32)"
                stroke="#173b5e"
                strokeWidth={Math.max(2.5, width / 300)}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
