import { describe, expect, it } from "vitest";

import { normalizeAnalyze } from "@/lib/normalize";

const backend = {
  mode: "MOCK",
  model: "muse-spark-1.3",
  objective_length: 37,
  facts: [
    { label: "product_name", value: "ACME Oat Drink", confidence: 1 },
    { label: "size", value: "1 L", confidence: 0.5 },
    { label: "note", value: "", confidence: "bad" },
  ],
  overall_confidence: 1,
  usage: {
    input_tokens: 132,
    output_tokens: 259,
    total_tokens: 391,
    estimated_cost_usd: 0.001266,
  },
  elapsed_ms: 0,
};

describe("normalizeAnalyze", () => {
  it("labels MOCK responses as source 'mock' and keeps the correlation id", () => {
    const r = normalizeAnalyze(backend, "cid123");
    expect(r.source).toBe("mock");
    expect(r.analysisId).toBe("cid123");
  });

  it("labels live responses as source 'meta-live'", () => {
    const r = normalizeAnalyze({ ...backend, mode: "live" }, "x");
    expect(r.source).toBe("meta-live");
  });

  it("humanizes labels and never invents confidence", () => {
    const r = normalizeAnalyze(backend, "x");
    expect(r.fields[0].label).toBe("Product name");
    expect(r.fields[0].confidence).toBe(1);
    expect(r.fields[2].confidence).toBeNull(); // non-numeric → null
    expect(r.fields[2].value).toBeNull(); // empty string → null
  });

  it("maps usage and detects an object", () => {
    const r = normalizeAnalyze(backend, "x");
    expect(r.usage?.totalTokens).toBe(391);
    expect(r.detectedObject).toBe("ACME Oat Drink");
  });

  it("adds a caution when no fields are returned", () => {
    const r = normalizeAnalyze({ mode: "MOCK", facts: [] }, "x");
    expect(r.fields).toHaveLength(0);
    expect(r.cautions.length).toBeGreaterThan(0);
  });

  it("preserves a valid SAM fractional region and never invents one", () => {
    const found = normalizeAnalyze({
      ...backend,
      target_found: true,
      target_phrase: "white rectangle",
      target_region: { x: 0.1, y: 0.2, width: 0.7, height: 0.6 },
    }, "x");
    expect(found.targetFound).toBe(true);
    expect(found.targetRegion).toEqual({ x: 0.1, y: 0.2, width: 0.7, height: 0.6 });
    expect(found.targetPhrase).toBe("white rectangle");

    const absent = normalizeAnalyze({ ...backend, target_found: false, target_region: { x: 0, y: 0, width: 1, height: 1 } }, "x");
    expect(absent.targetFound).toBe(false);
    expect(absent.targetRegion).toBeNull();
  });

  it("rejects invalid fractional geometry", () => {
    const result = normalizeAnalyze({
      ...backend,
      target_found: true,
      target_region: { x: 0.9, y: 0.2, width: 0.5, height: 0.3 },
    }, "x");
    expect(result.targetFound).toBe(false);
    expect(result.targetRegion).toBeNull();
  });
});
