import { afterEach, describe, expect, it, vi } from "vitest";

import { analyzeImage, ApiError } from "./api";
import { ANALYZE_TIMEOUT_MS } from "./config";

describe("analyzeImage request deadline", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("allows time for a sleeping Render Free instance and reports a useful timeout", async () => {
    expect(ANALYZE_TIMEOUT_MS).toBe(120_000);
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        }),
      ),
    );

    const request = analyzeImage({
      base64: "c3ludGhldGlj",
      mimeType: "image/png",
      objective: "Read the synthetic label.",
    });
    const rejection = expect(request).rejects.toMatchObject({
      name: "ApiError",
      kind: "timeout",
      hint: "The free backend may still be waking after inactivity. Keep this page open, wait a moment, then retry once.",
    } satisfies Partial<ApiError>);

    await vi.advanceTimersByTimeAsync(ANALYZE_TIMEOUT_MS);
    await rejection;
  });
});
