import { API_BASE, GROUND_TIMEOUT_MS } from "./config";
import { ApiError } from "./api";
import type { GroundingBox, GroundingMask, GroundingResult } from "@/types/grounding";

export interface GroundInput {
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  targetPhrase: string;
  accessToken?: string;
  signal?: AbortSignal;
}

export async function sha256Base64(base64: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error("Secure image verification is unavailable in this browser.");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function finiteBox(value: unknown): GroundingBox | null {
  if (!value || typeof value !== "object") return null;
  const box = value as Record<string, unknown>;
  const { x, y, width, height } = box;
  if (![x, y, width, height].every((n) => typeof n === "number" && Number.isFinite(n))) return null;
  if ((x as number) < 0 || (y as number) < 0 || (width as number) <= 0 || (height as number) <= 0 ||
      (x as number) + (width as number) > 1.000001 || (y as number) + (height as number) > 1.000001) return null;
  return { x: x as number, y: y as number, width: width as number, height: height as number };
}

export function normalizeGrounding(
  raw: unknown,
  correlationId: string,
  expected: { sha256: string; width: number; height: number },
): GroundingResult {
  if (!raw || typeof raw !== "object") throw new Error("The server returned an invalid grounding response.");
  const r = raw as Record<string, unknown>;
  if (r.mode !== "live" && r.mode !== "MOCK") throw new Error("The server did not identify the grounding source.");
  if (r.image_sha256 !== expected.sha256 || r.image_width !== expected.width || r.image_height !== expected.height) {
    throw new Error("Grounding belongs to a different image. Run it again for the current image.");
  }
  if (typeof r.target_phrase !== "string" || !Array.isArray(r.objects)) {
    throw new Error("The server returned an incomplete grounding result.");
  }
  const objects = r.objects.map((item: unknown) => {
    if (!item || typeof item !== "object") throw new Error("A grounded object is malformed.");
    const o = item as Record<string, unknown>;
    const box = finiteBox(o.box);
    if (!box || typeof o.object_id !== "string" || typeof o.label !== "string") {
      throw new Error("A grounded object has invalid geometry.");
    }
    let mask: GroundingMask | null = null;
    if (o.mask !== null && o.mask !== undefined) {
      const m = o.mask as Record<string, unknown>;
      const bounds = finiteBox(m.bounds);
      if (
        m.encoding !== "svg-path" || typeof m.path !== "string" || m.path.length > 350_000 ||
        !/^[MLZmlz0-9.,\s+\-]+$/.test(m.path) || !bounds ||
        typeof m.width !== "number" || typeof m.height !== "number" ||
        !Number.isInteger(m.width) || !Number.isInteger(m.height) || m.width <= 0 || m.height <= 0
      ) throw new Error("A grounded mask is invalid.");
      mask = { encoding: "svg-path", path: m.path, width: m.width, height: m.height, bounds };
    }
    const score = typeof o.score === "number" && Number.isFinite(o.score) ? o.score : null;
    return { objectId: o.object_id, label: o.label, box, mask, score };
  });
  return {
    mode: r.mode,
    provider: typeof r.provider === "string" ? r.provider : "unknown",
    model: typeof r.model === "string" ? r.model : "unknown",
    status: objects.length > 1
      ? "multiple_candidates"
      : r.status === "no_match" || r.status === "mock_unavailable" ? r.status : "completed",
    imageWidth: expected.width,
    imageHeight: expected.height,
    imageSha256: expected.sha256,
    targetPhrase: r.target_phrase,
    objects,
    diagnostics: Array.isArray(r.diagnostics) ? r.diagnostics as GroundingResult["diagnostics"] : [],
    correlationId: typeof r.correlation_id === "string" ? r.correlation_id : correlationId,
    responseId: typeof r.response_id === "string" ? r.response_id : null,
    elapsedMs: typeof r.elapsed_ms === "number" && Number.isFinite(r.elapsed_ms) ? r.elapsed_ms : 0,
    estimatedCostUsd: r.mode === "MOCK" ? 0 :
      (typeof r.estimated_cost_usd === "number" && Number.isFinite(r.estimated_cost_usd) ? r.estimated_cost_usd : 0),
  };
}

export async function groundImage({
  base64, mimeType, width, height, targetPhrase, accessToken, signal,
}: GroundInput): Promise<GroundingResult> {
  if (!API_BASE) {
    throw new ApiError("network", "The Groundline API is not configured.", "Configure the HTTPS API origin and rebuild.");
  }
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, GROUND_TIMEOUT_MS);
  try {
    if (signal?.aborted) {
      throw new ApiError("unknown", "The grounding request was cancelled.", "Start grounding again when ready.");
    }
    const localSha = await sha256Base64(base64);
    if (timedOut) {
      throw new ApiError("timeout", "Grounding timed out.", "Confirm whether the prior request ended before retrying.");
    }
    if (signal?.aborted || controller.signal.aborted) {
      throw new ApiError("unknown", "The grounding request was cancelled.", "Start grounding again when ready.");
    }
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) headers["X-Groundline-Access-Token"] = accessToken;
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/api/ground`, {
        method: "POST",
        headers,
        body: JSON.stringify({ mime_type: mimeType, image_base64: base64, target_phrase: targetPhrase }),
        signal: controller.signal,
      });
    } catch {
      if (signal?.aborted) throw new ApiError("unknown", "The grounding request was cancelled.", "Start grounding again when ready.");
      if (timedOut) throw new ApiError("timeout", "Grounding timed out.", "Confirm whether the prior request ended before retrying.");
      throw new ApiError("network", "Could not reach the Groundline grounding service.", `Check the API at ${API_BASE} and try again.`);
    }
    const correlationId = response.headers.get("X-Correlation-ID") ?? "";
    if (!response.ok) {
      const copy: Record<number, [string, string]> = {
        401: ["Restricted access is required for live grounding.", "Use a valid test access code or stay on the public MOCK path."],
        413: ["This grounding request is too large.", "Choose an image under 4 MB and try again."],
        422: ["The image or target phrase could not be used.", "Check the image and use one short object name."],
        429: ["The grounding quota has been reached.", "Wait for the quota window to reset before another request."],
        503: ["Live grounding is currently unavailable.", "The restricted service may be disabled or its shared quota store unavailable."],
        504: ["Grounding timed out.", "The request may have reached the provider; confirm its status before trying again."],
      };
      const [message, hint] = copy[response.status] ?? ["Grounding could not be completed.", "Try again only after checking that the previous request ended."];
      throw new ApiError(response.status === 422 ? "validation" : response.status === 504 ? "timeout" : "model", message, hint);
    }
    let raw: unknown;
    try {
      raw = await response.json();
    } catch {
      throw new ApiError("model", "The grounding service returned invalid JSON.", "Clear the result and contact the project maintainer if this continues.");
    }
    try {
      return normalizeGrounding(raw, correlationId, { sha256: localSha, width, height });
    } catch (error) {
      throw new ApiError("model", error instanceof Error ? error.message : "The grounding response is invalid.", "The response was not applied to the image. Verify the image and request status before retrying.");
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}
