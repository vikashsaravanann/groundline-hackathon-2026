/** Resolve the API URL without allowing production builds to silently target localhost. */
export function resolveApiBase(configured: string | undefined, production: boolean): string {
  const candidate = configured?.trim();
  if (!candidate) return production ? "" : "http://localhost:8000";

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be an absolute HTTP(S) origin.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must use HTTP or HTTPS.");
  }
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be an origin without credentials, path, query, or fragment.");
  }
  if (production && url.protocol !== "https:") {
    throw new Error("Production NEXT_PUBLIC_API_BASE_URL must use HTTPS.");
  }
  if (production && ["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    throw new Error("Production NEXT_PUBLIC_API_BASE_URL cannot point to localhost.");
  }

  return url.origin.replace(/\/+$/, "");
}

// NEXT_PUBLIC_* values are inlined at build time by Next.js. Keep this value
// browser-safe: it is only a URL and never contains credentials.
export const API_BASE = resolveApiBase(
  process.env.NEXT_PUBLIC_API_BASE_URL,
  process.env.NODE_ENV === "production",
);

export function resolveSiteUrl(configured: string | undefined, production: boolean): URL | undefined {
  const candidate = configured?.trim();
  if (!candidate) return undefined;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute HTTPS origin.");
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    (production && ["localhost", "127.0.0.1", "::1"].includes(url.hostname))
  ) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTPS origin without credentials, path, query, or fragment.");
  }

  return new URL(url.origin);
}

export const SITE_URL = resolveSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.NODE_ENV === "production",
);

// These ceilings mirror apps/api (MAX_IMAGE_BYTES, MAX_OBJECTIVE_CHARS,
// ALLOWED_IMAGE_MIME). Keep them in sync with the backend validators.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MiB
export const MAX_OBJECTIVE_CHARS = 500;
export const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"] as const;
export type AllowedMime = (typeof ALLOWED_MIME)[number];

// Snapshots/uploads are resized in the browser before they ever leave the page.
export const SNAPSHOT_MIME: AllowedMime = "image/jpeg";
export const SNAPSHOT_MAX_EDGE = 1280; // longest side, pixels

// Render Free may take 50 seconds or more to wake after inactivity. Keep a
// bounded wait with headroom, but never auto-retry: future LIVE requests can
// incur a charge and the first response may only be delayed, not lost.
export const ANALYZE_TIMEOUT_MS = 120_000;

// Synthetic example objectives (no real purchases/registrations implied).
export const EXAMPLE_OBJECTIVES = [
  "Read the model number from this label.",
  "Identify the product information I need for a warranty form.",
  "Explain which visible fields are missing.",
];
