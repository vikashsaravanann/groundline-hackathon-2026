import { describe, expect, it } from "vitest";

import { resolveApiBase, resolveSiteUrl } from "./config";

describe("resolveApiBase", () => {
  it("uses localhost only outside production when unset", () => {
    expect(resolveApiBase(undefined, false)).toBe("http://localhost:8000");
  });

  it("does not silently fall back to localhost in production", () => {
    expect(resolveApiBase(undefined, true)).toBe("");
  });

  it("accepts and normalizes an HTTPS production origin", () => {
    expect(resolveApiBase("https://api.example.test/", true)).toBe("https://api.example.test");
  });

  it("rejects HTTP and localhost production origins", () => {
    expect(() => resolveApiBase("http://api.example.test", true)).toThrow(/HTTPS/);
    expect(() => resolveApiBase("https://localhost:8000", true)).toThrow(/localhost/);
  });

  it("rejects paths, credentials, query strings, and non-HTTP protocols", () => {
    for (const value of [
      "https://api.example.test/v1",
      "https://user:pass@api.example.test",
      "https://api.example.test?key=value",
      "ftp://api.example.test",
    ]) {
      expect(() => resolveApiBase(value, false)).toThrow();
    }
  });
});

describe("resolveSiteUrl", () => {
  it("leaves public metadata base unset until a verified site origin is configured", () => {
    expect(resolveSiteUrl(undefined, true)).toBeUndefined();
  });

  it("accepts only a clean HTTPS origin", () => {
    expect(resolveSiteUrl("https://groundline.example/", true)?.origin).toBe("https://groundline.example");
    expect(() => resolveSiteUrl("http://groundline.example", true)).toThrow(/HTTPS origin/);
    expect(() => resolveSiteUrl("https://groundline.example/path", true)).toThrow(/HTTPS origin/);
  });
});
