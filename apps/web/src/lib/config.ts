// Backend location comes from the environment, never hard-coded. The frontend
// holds no credentials; this is a plain URL and is safe to inline at build.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://localhost:8000";

// These ceilings mirror apps/api (MAX_IMAGE_BYTES, MAX_OBJECTIVE_CHARS,
// ALLOWED_IMAGE_MIME). Keep them in sync with the backend validators.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MiB
export const MAX_OBJECTIVE_CHARS = 500;
export const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"] as const;

// Snapshots are resized in the browser before they ever leave the page.
export const SNAPSHOT_MIME = "image/jpeg" as const;
export const SNAPSHOT_MAX_EDGE = 1024; // longest side, pixels
