import { ANALYZE_TIMEOUT_MS, API_BASE } from "./config";
import { normalizeAnalyze } from "./normalize";
import type { AnalysisResult } from "@/types/analysis";
import type { StudioErrorKind } from "@/types/studio";

export class ApiError extends Error {
  kind: StudioErrorKind;
  hint: string;
  constructor(kind: StudioErrorKind, message: string, hint: string) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.hint = hint;
  }
}

export interface AnalyzeInput {
  base64: string;
  mimeType: string;
  objective: string;
  signal?: AbortSignal;
}

/**
 * POST the captured image + objective to the backend and return a normalized
 * AnalysisResult. A hard timeout bounds a hung backend; the caller may also
 * pass a signal to cancel. No credential is ever sent from the browser — the
 * backend holds every key.
 */
export async function analyzeImage({
  base64,
  mimeType,
  objective,
  signal,
}: AnalyzeInput): Promise<AnalysisResult> {
  if (!API_BASE) {
    throw new ApiError(
      "network",
      "The Groundline API is not configured for this deployment.",
      "Set NEXT_PUBLIC_API_BASE_URL to the HTTPS API origin, then rebuild the frontend.",
    );
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, ANALYZE_TIMEOUT_MS);
  signal?.addEventListener("abort", () => controller.abort(), { once: true });

  let resp: Response;
  try {
    resp = await fetch(`${API_BASE}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objective, mime_type: mimeType, image_base64: base64 }),
      signal: controller.signal,
    });
  } catch {
    if (timedOut) {
      throw new ApiError(
        "timeout",
        "The analysis request timed out.",
        "The backend took too long to respond. Check it is running, then try again.",
      );
    }
    if (signal?.aborted) {
      throw new ApiError("unknown", "The request was cancelled.", "Start the analysis again when ready.");
    }
    throw new ApiError(
      "network",
      "Could not reach the Groundline backend.",
      `Is the API running at ${API_BASE}? Start it, then try again.`,
    );
  } finally {
    clearTimeout(timer);
  }

  const correlationId = resp.headers.get("X-Correlation-ID") ?? "";

  if (!resp.ok) {
    let detail = `The server responded with ${resp.status}.`;
    try {
      const j = await resp.json();
      if (j?.detail) {
        detail = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
      }
    } catch {
      /* keep the generic status message */
    }
    const kind: StudioErrorKind =
      resp.status === 422 ? "validation" : resp.status >= 500 ? "model" : "unknown";
    throw new ApiError(
      kind,
      detail,
      kind === "validation"
        ? "Adjust your image or objective and try again."
        : "Please try again in a moment.",
    );
  }

  let raw: unknown;
  try {
    raw = await resp.json();
  } catch {
    throw new ApiError(
      "model",
      "The server returned an invalid response.",
      "Try again; if it persists the backend may be misconfigured.",
    );
  }
  return normalizeAnalyze(raw, correlationId);
}
