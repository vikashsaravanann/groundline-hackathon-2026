import {
  ALLOWED_MIME,
  MAX_IMAGE_BYTES,
  SNAPSHOT_MAX_EDGE,
  SNAPSHOT_MIME,
} from "./config";
import type { Snapshot } from "./types";

/**
 * Grab a single still from a live <video>, resize it in the browser, validate
 * its MIME type, and enforce the backend's byte ceiling — all before the frame
 * leaves the page. Never streams; one frame per call, on an explicit click.
 */
export async function captureSnapshot(video: HTMLVideoElement): Promise<Snapshot> {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) {
    throw new Error("The camera has not produced a frame yet — try again in a moment.");
  }

  const scale = Math.min(1, SNAPSHOT_MAX_EDGE / Math.max(vw, vh));
  const w = Math.max(1, Math.round(vw * scale));
  const h = Math.max(1, Math.round(vh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get a drawing context to process the snapshot.");
  }
  ctx.drawImage(video, 0, 0, w, h);

  // Step quality down until the encoded image is under the ceiling.
  let quality = 0.9;
  let dataUrl = canvas.toDataURL(SNAPSHOT_MIME, quality);
  while (estimateBytes(dataUrl) > MAX_IMAGE_BYTES && quality > 0.3) {
    quality -= 0.15;
    dataUrl = canvas.toDataURL(SNAPSHOT_MIME, quality);
  }

  const mimeType = dataUrl.slice(5, dataUrl.indexOf(";"));
  if (!ALLOWED_MIME.includes(mimeType as (typeof ALLOWED_MIME)[number])) {
    throw new Error(`The browser produced an unsupported image type (${mimeType}).`);
  }

  const bytes = estimateBytes(dataUrl);
  if (bytes > MAX_IMAGE_BYTES) {
    throw new Error(
      "The snapshot is too large even after compression — move back and try again.",
    );
  }

  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return { dataUrl, base64, mimeType, bytes, width: w, height: h };
}

/** Byte length of the data URL's base64 payload, without decoding it. */
function estimateBytes(dataUrl: string): number {
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}
