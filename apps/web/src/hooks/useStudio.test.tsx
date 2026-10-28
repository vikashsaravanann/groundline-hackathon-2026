import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useStudio } from "@/hooks/useStudio";
import { analyzeImage } from "@/lib/api";
import { groundImage } from "@/lib/grounding";
import { imageFromFile } from "@/lib/image";
import type { SelectedImage } from "@/types/studio";

vi.mock("@/lib/image", () => ({
  captureFromVideo: vi.fn(),
  imageFromFile: vi.fn(),
}));
vi.mock("@/lib/grounding", () => ({ groundImage: vi.fn() }));
vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {},
  analyzeImage: vi.fn(),
}));

const selected: SelectedImage = {
  dataUrl: "data:image/png;base64,AAAA",
  base64: "AAAA",
  mimeType: "image/png",
  bytes: 3,
  width: 10,
  height: 10,
  origin: "upload",
};

const analysis = {
  analysisId: "analysis-1", source: "mock", status: "completed", summary: "sample",
  detectedObject: "desk lamp", fields: [{
    id: "field-0", label: "Model number", modelValue: "GL-OLD", value: "GL-OLD",
    confidence: null, evidence: null, userConfirmed: false,
  }], cautions: [], analyzedAt: "2026-10-28T00:00:00Z",
  model: "fixture", usage: null, targetFound: false, targetRegion: null,
  targetPhrase: null, correctionEvents: [],
};

const groundResult = {
  mode: "MOCK", provider: "synthetic-fixture", model: "sam-3.1", status: "completed",
  imageWidth: 10, imageHeight: 10, imageSha256: "a".repeat(64), targetPhrase: "desk lamp",
  objects: [], diagnostics: [], correlationId: "c1", responseId: null, elapsedMs: 0, estimatedCostUsd: 0,
  labelRegion: null, fieldRegion: null, fieldStatus: "not_attempted",
  samUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, imagesProcessed: 0 },
  sparkUsage: null, samEstimatedCostUsd: 0, sparkEstimatedCostUsd: 0,
} as const;

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

  beforeEach(() => {
    vi.mocked(imageFromFile).mockReset();
    vi.mocked(analyzeImage).mockReset();
    vi.mocked(groundImage).mockReset();
  });

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

  it("discards a late grounding result after the target phrase changes", async () => {
    vi.mocked(imageFromFile).mockResolvedValue(selected);
    vi.mocked(analyzeImage).mockResolvedValue(analysis as never);
    let resolveGrounding!: (value: typeof groundResult) => void;
    vi.mocked(groundImage).mockImplementation(() => new Promise((resolve) => { resolveGrounding = resolve; }));

    const { result } = renderHook(() => useStudio());
    await act(async () => result.current.selectFile(new File(["synthetic"], "sample.png", { type: "image/png" })));
    act(() => result.current.setObjective("Identify the visible label information"));
    await act(async () => result.current.analyze());
    expect(result.current.targetPhrase).toBe("desk lamp");

    let pending!: Promise<void>;
    act(() => { pending = result.current.ground(); });
    expect(result.current.groundingStatus).toBe("grounding");
    act(() => result.current.setTargetPhrase("product box"));
    await act(async () => {
      resolveGrounding(groundResult);
      await pending;
    });
    expect(result.current.groundingResult).toBeNull();
    expect(result.current.groundingStatus).toBe("ready");
  });

  it("aborts an in-flight SAM request when the user re-analyzes", async () => {
    vi.mocked(imageFromFile).mockResolvedValue(selected);
    vi.mocked(analyzeImage).mockResolvedValue(analysis as never);
    let groundingSignal: AbortSignal | undefined;
    vi.mocked(groundImage).mockImplementation((_input) => {
      groundingSignal = _input.signal;
      return new Promise(() => undefined);
    });

    const { result } = renderHook(() => useStudio());
    await act(async () => result.current.selectFile(new File(["synthetic"], "sample.png", { type: "image/png" })));
    act(() => result.current.setObjective("Identify the visible label information"));
    await act(async () => result.current.analyze());
    act(() => { void result.current.ground(); });
    expect(groundingSignal?.aborted).toBe(false);

    await act(async () => result.current.analyze());
    expect(groundingSignal?.aborted).toBe(true);
    expect(result.current.groundingResult).toBeNull();
    expect(result.current.groundingStatus).toBe("idle");
  });

  it("does not confidently preselect one of multiple grounding candidates", async () => {
    vi.mocked(imageFromFile).mockResolvedValue(selected);
    vi.mocked(analyzeImage).mockResolvedValue(analysis as never);
    vi.mocked(groundImage).mockResolvedValue({
      ...groundResult,
      status: "multiple_candidates",
      objects: [
        { objectId: "0", label: "printed product label", box: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 }, mask: null, score: null },
        { objectId: "1", label: "printed product label", box: { x: 0.6, y: 0.2, width: 0.3, height: 0.4 }, mask: null, score: null },
      ],
    });

    const { result } = renderHook(() => useStudio());
    await act(async () => result.current.selectFile(new File(["synthetic"], "sample.png", { type: "image/png" })));
    act(() => result.current.setObjective("Identify the visible label information"));
    await act(async () => result.current.analyze());
    await act(async () => result.current.ground());

    expect(result.current.groundingStatus).toBe("multiple-candidates");
    expect(result.current.selectedGroundingObjectId).toBeNull();
  });

  it("replaces an extracted value and records the model-to-human correction", async () => {
    vi.mocked(imageFromFile).mockResolvedValue(selected);
    vi.mocked(analyzeImage).mockResolvedValue(analysis as never);
    const { result } = renderHook(() => useStudio());
    await act(async () => result.current.selectFile(new File(["synthetic"], "sample.png", { type: "image/png" })));
    act(() => result.current.setObjective("Read the model number"));
    await act(async () => result.current.analyze());

    act(() => result.current.editField("field-0", "GL-CORRECTED"));
    expect(result.current.result?.fields[0].value).toBe("GL-CORRECTED");
    expect(result.current.result?.correctionEvents).toHaveLength(1);
    expect(result.current.result?.correctionEvents[0]).toMatchObject({
      fieldId: "field-0",
      originalValue: "GL-OLD",
      correctedValue: "GL-CORRECTED",
    });
    expect(Number.isNaN(Date.parse(result.current.result!.correctionEvents[0].timestamp))).toBe(false);
  });
});
