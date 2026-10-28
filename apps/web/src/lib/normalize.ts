import type { AnalysisField, AnalysisResult } from "@/types/analysis";

interface RawFact {
  label?: unknown;
  value?: unknown;
  confidence?: unknown;
}

interface RawUsage {
  input_tokens?: unknown;
  output_tokens?: unknown;
  total_tokens?: unknown;
  estimated_cost_usd?: unknown;
}

interface RawAnalyze {
  mode?: unknown;
  model?: unknown;
  facts?: unknown;
  usage?: RawUsage;
  target_found?: unknown;
  target_region?: unknown;
  target_phrase?: unknown;
}

/**
 * Adapt the backend's /api/analyze response into the UI's AnalysisResult.
 * Confidence is passed through only when the backend genuinely returned a
 * number — never invented. `source` is derived from the response's own mode, so
 * a fixture is always labelled MOCK and a real response LIVE.
 */
export function normalizeAnalyze(raw: unknown, correlationId: string): AnalysisResult {
  const r = (raw ?? {}) as RawAnalyze;
  const source = r.mode === "live" ? "meta-live" : "mock";

  const rawFacts = Array.isArray(r.facts) ? (r.facts as RawFact[]) : [];
  const fields: AnalysisField[] = rawFacts.map((f, i) => {
    const value = typeof f.value === "string" && f.value.trim() ? f.value.trim() : null;
    const confidence =
      typeof f.confidence === "number" && Number.isFinite(f.confidence)
        ? clamp01(f.confidence)
        : null;
    return {
      id: `field-${i}`,
      label: humanize(typeof f.label === "string" ? f.label : `Field ${i + 1}`),
      modelValue: value,
      value,
      confidence,
      evidence: null, // backend does not yet supply per-field evidence
      userConfirmed: false,
    };
  });

  const detectedObject =
    fields.find((f) => /product|object|name|item|model/i.test(f.label))?.value ?? null;

  const usage =
    r.usage && typeof r.usage === "object"
      ? {
          inputTokens: num(r.usage.input_tokens),
          outputTokens: num(r.usage.output_tokens),
          totalTokens: num(r.usage.total_tokens),
          estimatedCostUsd: num(r.usage.estimated_cost_usd),
        }
      : null;

  const targetRegion = normalizeRegion(r.target_region);
  return {
    analysisId: correlationId || randomId(),
    source,
    status: "completed",
    summary: buildSummary(fields.length, detectedObject),
    detectedObject,
    fields,
    cautions:
      fields.length === 0
        ? ["No readable fields were returned for this image and objective. Try a clearer photo."]
        : [],
    analyzedAt: new Date().toISOString(),
    model: typeof r.model === "string" ? r.model : null,
    usage,
    targetFound: r.target_found === true && targetRegion !== null,
    targetRegion: r.target_found === true ? targetRegion : null,
    targetPhrase: typeof r.target_phrase === "string" ? r.target_phrase : null,
    correctionEvents: [],
  };
}

function normalizeRegion(value: unknown): AnalysisResult["targetRegion"] {
  if (value === null || typeof value !== "object") return null;
  const region = value as Record<string, unknown>;
  const { x, y, width, height } = region;
  if (![x, y, width, height].every((part) => typeof part === "number" && Number.isFinite(part))) return null;
  const nx = x as number;
  const ny = y as number;
  const nw = width as number;
  const nh = height as number;
  if (nx < 0 || ny < 0 || nw <= 0 || nh <= 0 || nx + nw > 1.000001 || ny + nh > 1.000001) return null;
  return { x: nx, y: ny, width: nw, height: nh };
}

function buildSummary(count: number, detected: string | null): string {
  const n = `${count} detail${count === 1 ? "" : "s"}`;
  return detected
    ? `Groundline read ${n} from ${detected}.`
    : `Groundline read ${n} from the image.`;
}

function humanize(label: string): string {
  const spaced = label.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function randomId(): string {
  try {
    return crypto.randomUUID().slice(0, 12);
  } catch {
    return Math.random().toString(36).slice(2, 14);
  }
}
