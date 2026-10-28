import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GroundingPanel } from "@/components/studio/GroundingPanel";
import type { Studio } from "@/hooks/useStudio";

const studio = {
  image: { dataUrl: "data:image/png;base64,AA==", width: 800, height: 600 },
  result: { facts: [] },
  targetPhrase: "white rectangle",
  selectedGroundingObjectId: "0",
  setTargetPhrase: vi.fn(),
  ground: vi.fn(),
  cancelGrounding: vi.fn(),
  clearGrounding: vi.fn(),
  groundingStatus: "completed",
  groundingError: null,
  groundingResult: {
    mode: "MOCK",
    model: "sam-3.1",
    provider: "synthetic-fixture",
    status: "completed",
    imageWidth: 800,
    imageHeight: 600,
    imageSha256: "fce3f287f1ec5ec8543a0f008d3269f5ad46feff6310b1d00e41c68262fa2048",
    targetPhrase: "desk lamp",
    objects: [{
      objectId: "0",
      label: "white rectangle",
      box: { x: 190 / 800, y: 105 / 600, width: 286 / 800, height: 420 / 600 },
      mask: {
        encoding: "svg-path",
        path: "M 1 1 L 6 6 Z",
        width: 143,
        height: 210,
        bounds: { x: 190 / 800, y: 105 / 600, width: 286 / 800, height: 420 / 600 },
      },
      score: null,
    }],
    labelRegion: {
      box: { x: 190 / 800, y: 105 / 600, width: 286 / 800, height: 420 / 600 },
      sourceModel: "sam-3.1", confidence: 0.55, mode: "MOCK",
      mask: {
        encoding: "svg-path", path: "M 1 1 L 6 6 Z", width: 143, height: 210,
        bounds: { x: 190 / 800, y: 105 / 600, width: 286 / 800, height: 420 / 600 },
      }, fieldName: null, value: null,
    },
    fieldRegion: {
      box: { x: 0.3, y: 0.4, width: 0.2, height: 0.08 },
      sourceModel: "muse-spark-1.3", confidence: 0.94, mode: "MOCK",
      mask: null, fieldName: "model number", value: "NSL-2048",
    },
    fieldStatus: "found",
    samUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, imagesProcessed: 0 },
    sparkUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, imagesProcessed: 0 },
    samEstimatedCostUsd: 0,
    sparkEstimatedCostUsd: 0,
    diagnostics: [],
    correlationId: "test-cid",
    responseId: "test-response",
    elapsedMs: 0,
    estimatedCostUsd: 0,
  },
} as unknown as Studio;

describe("GroundingPanel", () => {
  it("aligns normalized box and mask geometry to the original image dimensions", () => {
    const { container } = render(<GroundingPanel studio={studio} />);
    const overlay = container.querySelector('svg[viewBox="0 0 800 600"]');
    expect(overlay).toHaveAttribute("viewBox", "0 0 800 600");
    const box = overlay?.querySelector("rect");
    expect(box).toHaveAttribute("x", "190");
    expect(box).toHaveAttribute("y", "105");
    expect(box).toHaveAttribute("width", "286");
    expect(box).toHaveAttribute("height", "420");
    expect(overlay?.querySelector("path")).toHaveAttribute("d", "M 1 1 L 6 6 Z");
    expect(screen.getByText("MOCK — fixture, not a live model call")).toBeInTheDocument();
    expect(screen.getByText(/Primary highlight · model number/)).toBeInTheDocument();
    expect(screen.getByText(/Faint context outline · product label/)).toBeInTheDocument();
  });

  it("lets a keyboard-activatable control confirm the selected region", async () => {
    const user = userEvent.setup();
    render(<GroundingPanel studio={studio} />);
    const confirm = screen.getByRole("button", { name: "Confirm selected region" });
    confirm.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByText("Confirmed for this review")).toBeInTheDocument();
  });
});
