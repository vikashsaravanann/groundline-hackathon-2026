import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

import { TargetRegionCanvas } from "@/components/studio/TargetRegionCanvas";

function sourceImage(width: number, height: number): HTMLImageElement {
  const image = document.createElement("img");
  Object.defineProperties(image, {
    complete: { value: true },
    naturalWidth: { value: width },
    naturalHeight: { value: height },
  });
  return image;
}

describe("TargetRegionCanvas", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("maps image fractions into the contained image area and scales its canvas by DPR", () => {
    const calls = { fill: vi.fn(), stroke: vi.fn(), transform: vi.fn(), clear: vi.fn(), rect: vi.fn() };
    const context = {
      setTransform: calls.transform,
      clearRect: calls.clear,
      save: vi.fn(), beginPath: vi.fn(), rect: calls.rect, clip: vi.fn(),
      fillRect: calls.fill, strokeRect: calls.stroke, restore: vi.fn(),
      set fillStyle(_value: string) {}, set strokeStyle(_value: string) {},
      set lineWidth(_value: number) {}, setLineDash: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as never);
    vi.stubGlobal("ResizeObserver", undefined);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 2 });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0, y: 0, top: 0, left: 0, right: 400, bottom: 400, width: 400, height: 400,
      toJSON: () => ({}),
    } as DOMRect);

    const { container } = render(
      <div style={{ width: 400, height: 400 }}>
        <TargetRegionCanvas image={sourceImage(1000, 500)} region={{ x: 0.25, y: 0.2, width: 0.5, height: 0.4 }} />
      </div>,
    );

    const canvas = container.querySelector("canvas");
    expect(canvas?.width).toBe(800);
    expect(canvas?.height).toBe(800);
    expect(calls.transform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
    // 1000x500 is contained in 400x400: 400x200 with a 100px top offset.
    expect(calls.fill).toHaveBeenCalledWith(100, 140, 200, 80);
    expect(calls.stroke).toHaveBeenCalledWith(100, 140, 200, 80);
  });

  it("draws nothing when target geometry is absent", () => {
    const fill = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      setTransform: vi.fn(), clearRect: vi.fn(), save: vi.fn(), beginPath: vi.fn(),
      rect: vi.fn(), clip: vi.fn(), fillRect: fill, strokeRect: vi.fn(), restore: vi.fn(),
    } as never);
    vi.stubGlobal("ResizeObserver", undefined);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0, y: 0, top: 0, left: 0, right: 100, bottom: 80, width: 100, height: 80,
      toJSON: () => ({}),
    } as DOMRect);

    render(<div style={{ width: 100, height: 80 }}><TargetRegionCanvas image={sourceImage(100, 80)} region={null} /></div>);
    expect(fill).not.toHaveBeenCalled();
  });
});
