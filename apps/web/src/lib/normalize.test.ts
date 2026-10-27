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
});
