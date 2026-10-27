// Backend location comes from the environment, never hard-coded. The frontend
// holds NO credentials; this is a plain URL, safe to inline at build. A
// separate Render-hosted backend can be pointed at later via this one variable.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://localhost:8000";

// These ceilings mirror apps/api (MAX_IMAGE_BYTES, MAX_OBJECTIVE_CHARS,
// ALLOWED_IMAGE_MIME). Keep them in sync with the backend validators.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MiB
export const MAX_OBJECTIVE_CHARS = 500;
export const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"] as const;
export type AllowedMime = (typeof ALLOWED_MIME)[number];

// Snapshots/uploads are resized in the browser before they ever leave the page.
export const SNAPSHOT_MIME: AllowedMime = "image/jpeg";
export const SNAPSHOT_MAX_EDGE = 1280; // longest side, pixels

// Request timeout for the analysis call (ms). Bounds a hung backend.
export const ANALYZE_TIMEOUT_MS = 30_000;

// Synthetic example objectives (no real purchases/registrations implied).
export const EXAMPLE_OBJECTIVES = [
  "Read the model number from this label.",
  "Identify the product information I need for a warranty form.",
  "Explain which visible fields are missing.",
];
