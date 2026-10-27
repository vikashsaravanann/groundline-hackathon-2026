import {
  ALLOWED_MIME,
  type AllowedMime,
  MAX_IMAGE_BYTES,
  SNAPSHOT_MAX_EDGE,
  SNAPSHOT_MIME,
} from "./config";
import type { SelectedImage } from "@/types/studio";

/**
 * Capture a single still from a live <video>, resize it, validate its MIME, and
 * enforce the backend's byte ceiling — all before the frame leaves the page.
 */
export async function captureFromVideo(video: HTMLVideoElement): Promise<SelectedImage> {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) {
    throw new Error("The camera has not produced a frame yet — try again in a moment.");
  }
  const canvas = drawScaled((ctx, w, h) => ctx.drawImage(video, 0, 0, w, h), vw, vh);
  return encode(canvas, "camera");
}

/**
 * Turn an uploaded File into a resized, validated SelectedImage. The declared
 * type is checked here; the backend re-validates the actual bytes.
 */
export async function imageFromFile(file: File): Promise<SelectedImage> {
  if (!ALLOWED_MIME.includes(file.type as AllowedMime)) {
    throw new Error(
      `That file type (${file.type || "unknown"}) is not supported. Use a PNG, JPEG or WebP image.`,
    );
  }
  // Reject absurdly large originals up front (before decoding).
  if (file.size > MAX_IMAGE_BYTES * 8) {
    throw new Error("That image is far too large. Choose a photo under ~30 MB.");
  }
  const bitmap = await loadBitmap(file);
  try {
    const canvas = drawScaled(
      (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
      bitmap.width,
      bitmap.height,
    );
    return encode(canvas, "upload");
  } finally {
    bitmap.close?.();
  }
}

function drawScaled(
  paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  srcW: number,
  srcH: number,
): HTMLCanvasElement {
  const scale = Math.min(1, SNAPSHOT_MAX_EDGE / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get a drawing context to process the image.");
  paint(ctx, w, h);
  return canvas;
}

function encode(canvas: HTMLCanvasElement, origin: SelectedImage["origin"]): SelectedImage {
  let quality = 0.9;
  let dataUrl = canvas.toDataURL(SNAPSHOT_MIME, quality);
  while (estimateBytes(dataUrl) > MAX_IMAGE_BYTES && quality > 0.3) {
    quality -= 0.15;
    dataUrl = canvas.toDataURL(SNAPSHOT_MIME, quality);
  }
  const mimeType = dataUrl.slice(5, dataUrl.indexOf(";"));
  if (!ALLOWED_MIME.includes(mimeType as AllowedMime)) {
    throw new Error(`The browser produced an unsupported image type (${mimeType}).`);
  }
  const bytes = estimateBytes(dataUrl);
  if (bytes > MAX_IMAGE_BYTES) {
    throw new Error("The image is too large even after compression — move back or pick a smaller photo.");
  }
  return {
    dataUrl,
    base64: dataUrl.slice(dataUrl.indexOf(",") + 1),
    mimeType,
    bytes,
    width: canvas.width,
    height: canvas.height,
    origin,
  };
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error("That image could not be read. It may be corrupt or an unsupported format.");
  }
}

/** Byte length of a data URL's base64 payload, without decoding it. */
export function estimateBytes(dataUrl: string): number {
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}
