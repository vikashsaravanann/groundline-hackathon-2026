import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useStudio } from "@/hooks/useStudio";
import { imageFromFile } from "@/lib/image";
import type { SelectedImage } from "@/types/studio";

vi.mock("@/lib/image", () => ({
  captureFromVideo: vi.fn(),
  imageFromFile: vi.fn(),
}));

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

  it("clears the captured still before restarting the camera for Retake", async () => {
    const stopTrack = vi.fn();
    const stream = {
      getTracks: () => [{ stop: stopTrack }],
      getVideoTracks: () => [],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    setMediaDevices({ getUserMedia, enumerateDevices: vi.fn().mockResolvedValue([]) });
    const selected: SelectedImage = {
      dataUrl: "data:image/jpeg;base64,AAAA",
      base64: "AAAA",
      mimeType: "image/jpeg",
      bytes: 3,
      width: 10,
      height: 10,
      origin: "upload",
    };
    vi.mocked(imageFromFile).mockResolvedValue(selected);

    const { result } = renderHook(() => useStudio());
    await act(async () => result.current.selectFile(new File(["label"], "label.jpg", { type: "image/jpeg" })));
    expect(result.current.image).toEqual(selected);

    await act(async () => result.current.startCamera());
    expect(result.current.image).toBeNull();
    expect(result.current.status).toBe("camera-ready");
    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });
});
