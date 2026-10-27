import { describe, expect, it, vi } from "vitest";

import { captureFromVideo, estimateBytes, sourceCropForFrame } from "@/lib/image";

describe("estimateBytes", () => {
  it("computes byte length from a data URL's base64 payload", () => {
    expect(estimateBytes("data:image/png;base64,AAAA")).toBe(3);
    expect(estimateBytes("data:image/png;base64,AAA=")).toBe(2);
    expect(estimateBytes("data:image/png;base64,AA==")).toBe(1);
  });
});

describe("sourceCropForFrame", () => {
  it("maps the dashed viewfinder to the source pixels visible inside the video viewport", () => {
    const crop = sourceCropForFrame(
      1920,
      1080,
      { left: 0, top: 0, width: 400, height: 300 },
      { left: 24, top: 24, width: 352, height: 252 },
    );

    expect(crop.x).toBeCloseTo(326.4, 1);
    expect(crop.y).toBeCloseTo(86.4, 1);
    expect(crop.width).toBeCloseTo(1267.2, 1);
    expect(crop.height).toBeCloseTo(907.2, 1);
    expect(crop.width / crop.height).toBeCloseTo(352 / 252, 5);
  });

  it("keeps a portrait source vertical when its preview and capture frame are portrait", () => {
    const crop = sourceCropForFrame(
      1080,
      1920,
      { left: 20, top: 40, width: 300, height: 533.333 },
      { left: 44, top: 64, width: 252, height: 485.333 },
    );

    expect(crop.width).toBeLessThan(crop.height);
    expect(crop.x).toBeGreaterThan(0);
    expect(crop.y).toBeGreaterThan(0);
    expect(crop.x + crop.width).toBeLessThan(1080);
    expect(crop.y + crop.height).toBeLessThan(1920);
  });

  it("returns the full source when the target is the whole viewport", () => {
    expect(sourceCropForFrame(
      1600,
      1200,
      { left: 10, top: 20, width: 400, height: 300 },
      { left: 10, top: 20, width: 400, height: 300 },
    )).toEqual({ x: 0, y: 0, width: 1600, height: 1200 });
  });

  it("draws the viewfinder crop into the saved still", async () => {
    const drawImage = vi.fn();
    const context = { drawImage } as unknown as CanvasRenderingContext2D;
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
      toDataURL: () => "data:image/jpeg;base64,AAAA",
    } as unknown as HTMLCanvasElement;
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(((tagName: string) =>
      tagName === "canvas" ? canvas : createElement(tagName)) as typeof document.createElement);

    const video = {
      videoWidth: 1920,
      videoHeight: 1080,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 }),
    } as unknown as HTMLVideoElement;
    const frame = {
      getBoundingClientRect: () => ({ left: 24, top: 24, width: 352, height: 252 }),
    } as unknown as HTMLElement;

    const captured = await captureFromVideo(video, frame);

    expect(drawImage).toHaveBeenCalledWith(
      video,
      expect.closeTo(326.4, 1),
      expect.closeTo(86.4, 1),
      expect.closeTo(1267.2, 1),
      expect.closeTo(907.2, 1),
      0,
      0,
      1267,
      907,
    );
    expect(captured.width).toBe(1267);
    expect(captured.height).toBe(907);
    expect(captured.origin).toBe("camera");
  });
});
