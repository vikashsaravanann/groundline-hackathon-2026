"use client";

import { useLayoutEffect, useRef } from "react";

import type { ImageRegion } from "@/types/analysis";

/** Draws only server-returned fractional geometry over the actual image area. */
export function TargetRegionCanvas({
  image,
  region,
  contextRegion = null,
}: {
  image: HTMLImageElement | null;
  region: ImageRegion | null;
  contextRegion?: ImageRegion | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const frame = canvas?.parentElement;
    if (!canvas || !frame || !image) return;

    let animationFrame = 0;
    const draw = () => {
      const bounds = frame.getBoundingClientRect();
      const cssWidth = bounds.width;
      const cssHeight = bounds.height;
      const ratio = Math.max(1, window.devicePixelRatio || 1);
      if (cssWidth <= 0 || cssHeight <= 0) return;

      const backingWidth = Math.round(cssWidth * ratio);
      const backingHeight = Math.round(cssHeight * ratio);
      if (canvas.width !== backingWidth) canvas.width = backingWidth;
      if (canvas.height !== backingHeight) canvas.height = backingHeight;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, cssWidth, cssHeight);

      if (
        !region || !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0
        || ![region.x, region.y, region.width, region.height].every(Number.isFinite)
        || region.x < 0 || region.y < 0 || region.width <= 0 || region.height <= 0
        || region.x + region.width > 1.000001 || region.y + region.height > 1.000001
      ) return;

      // Match object-fit: contain, including any letterbox offsets in the frame.
      const scale = Math.min(cssWidth / image.naturalWidth, cssHeight / image.naturalHeight);
      const renderedWidth = image.naturalWidth * scale;
      const renderedHeight = image.naturalHeight * scale;
      const offsetX = (cssWidth - renderedWidth) / 2;
      const offsetY = (cssHeight - renderedHeight) / 2;
      const drawRegion = (item: ImageRegion) => {
        if (
          ![item.x, item.y, item.width, item.height].every(Number.isFinite)
          || item.x < 0 || item.y < 0 || item.width <= 0 || item.height <= 0
          || item.x + item.width > 1.000001 || item.y + item.height > 1.000001
        ) return null;
        return {
          x: offsetX + item.x * renderedWidth,
          y: offsetY + item.y * renderedHeight,
          width: item.width * renderedWidth,
          height: item.height * renderedHeight,
        };
      };

      const contextBox = contextRegion ? drawRegion(contextRegion) : null;
      if (contextBox) {
        context.save();
        context.beginPath();
        context.rect(offsetX, offsetY, renderedWidth, renderedHeight);
        context.clip();
        context.strokeStyle = "rgba(73, 96, 123, 0.62)";
        context.lineWidth = 1.75;
        context.setLineDash([7, 5]);
        context.strokeRect(contextBox.x, contextBox.y, contextBox.width, contextBox.height);
        context.restore();
      }

      const primaryBox = drawRegion(region);
      if (!primaryBox) return;

      context.save();
      context.beginPath();
      context.rect(offsetX, offsetY, renderedWidth, renderedHeight);
      context.clip();
      context.fillStyle = "rgba(64, 126, 180, 0.30)";
      context.fillRect(primaryBox.x, primaryBox.y, primaryBox.width, primaryBox.height);
      context.strokeStyle = "#245985";
      context.lineWidth = 2.5;
      context.setLineDash([]);
      context.strokeRect(primaryBox.x, primaryBox.y, primaryBox.width, primaryBox.height);
      context.restore();
    };

    const scheduleDraw = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(draw);
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleDraw);
    observer?.observe(frame);
    observer?.observe(image);
    image.addEventListener("load", scheduleDraw);
    window.addEventListener("resize", scheduleDraw);
    scheduleDraw();

    return () => {
      cancelAnimationFrame(animationFrame);
      observer?.disconnect();
      image.removeEventListener("load", scheduleDraw);
      window.removeEventListener("resize", scheduleDraw);
    };
  }, [image, region, contextRegion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      data-testid="target-region-canvas"
    />
  );
}
