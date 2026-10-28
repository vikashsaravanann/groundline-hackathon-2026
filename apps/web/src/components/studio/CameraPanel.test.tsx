import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { CameraPanel } from "@/components/studio/CameraPanel";
import type { Studio } from "@/hooks/useStudio";

const baseStudio = {
  status: "completed",
  capturing: false,
  camera: {
    active: false,
    hasMultipleCameras: false,
    videoRef: { current: null },
    switchCamera: vi.fn(),
    stop: vi.fn(),
  },
  image: {
    dataUrl: "data:image/png;base64,AA==", base64: "AA==", mimeType: "image/png",
    bytes: 1, width: 1200, height: 820, origin: "upload",
  },
  result: {
    analysisId: "mock-cid", source: "mock", status: "completed", summary: "Sample analysis",
    detectedObject: "Product label", fields: [], cautions: [], analyzedAt: "2026-10-28T00:00:00Z",
    model: "muse-spark-1.3", usage: null, targetFound: false, targetRegion: null,
    targetPhrase: null, correctionEvents: [],
  },
} as unknown as Studio;

describe("CameraPanel target overlay", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("states target not found and does not mount a guessed canvas", () => {
    render(<CameraPanel studio={baseStudio} />);
    expect(screen.getByRole("status")).toHaveTextContent("Target not found");
    expect(screen.queryByTestId("target-region-canvas")).not.toBeInTheDocument();
  });

  it("does not describe a refused analysis as a missing visual target", () => {
    const refused = {
      ...baseStudio,
      result: {
        ...baseStudio.result,
        status: "refused",
        refusalMessage: "This request is outside scope and was not sent to an AI provider.",
      },
    } as unknown as Studio;
    render(<CameraPanel studio={refused} />);
    expect(screen.queryByText(/Target not found/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Multiple candidates/)).not.toBeInTheDocument();
  });

  it("mounts a canvas and visible MOCK provenance only for returned geometry", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const found = {
      ...baseStudio,
      targetPhrase: "white rectangle",
      result: {
        ...baseStudio.result,
        targetFound: true,
        targetPhrase: "white rectangle",
        targetRegion: { x: 0.1, y: 0.1, width: 0.8, height: 0.7 },
      },
    } as unknown as Studio;

    render(<CameraPanel studio={found} />);
    expect(screen.getByTestId("target-region-canvas")).toBeInTheDocument();
    expect(screen.getByText("MOCK — fixture, not a live model call")).toBeInTheDocument();
    expect(screen.queryByText(/Target not found/)).not.toBeInTheDocument();
  });
});
