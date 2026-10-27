import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useStudio } from "@/hooks/useStudio";

function setMediaDevices(value: unknown) {
  Object.defineProperty(navigator, "mediaDevices", {
    value,
    configurable: true,
    writable: true,
  });
}

describe("useStudio", () => {
  beforeEach(() => setMediaDevices(undefined));
  afterEach(() => vi.restoreAllMocks());

  it("starts idle and never touches the camera on mount", () => {
    const getUserMedia = vi.fn();
    setMediaDevices({ getUserMedia, enumerateDevices: vi.fn().mockResolvedValue([]) });

    const { result } = renderHook(() => useStudio());
    expect(result.current.status).toBe("idle");
    expect(result.current.objectiveValid).toBe(false);
    expect(result.current.canAnalyze).toBe(false);
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("gates analyze on both an image and a valid objective", () => {
    const { result } = renderHook(() => useStudio());
    expect(result.current.canAnalyze).toBe(false);

    act(() => result.current.setObjective("read the model number"));
    expect(result.current.objectiveValid).toBe(true);
    // Still no image, so analysis stays disabled.
    expect(result.current.canAnalyze).toBe(false);
  });

  it("reports an unsupported-camera error without throwing", async () => {
    setMediaDevices(undefined);
    const { result } = renderHook(() => useStudio());
    await act(async () => {
      await result.current.startCamera();
    });
    expect(result.current.status).toBe("error");
    expect(result.current.error?.kind).toBe("unsupported");
  });
});
