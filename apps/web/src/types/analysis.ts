// Application-level analysis contract. The backend's raw response is adapted
// into this shape (see lib/normalize.ts); the UI never assumes the model
// produces this object directly.

export type AnalysisSource = "meta-live" | "mock";

export interface AnalysisField {
  id: string;
  label: string;
  value: string | null;
  /** Model-reported, never invented. null → shown as "Not evaluated". */
  confidence: number | null;
  /** Per-field evidence when the backend supplies it; otherwise null. */
  evidence: string | null;
  userConfirmed: boolean;
}

export interface AnalysisUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface AnalysisResult {
  analysisId: string;
  source: AnalysisSource;
  status: "completed" | "partial";
  summary: string;
  detectedObject: string | null;
  fields: AnalysisField[];
  cautions: string[];
  analyzedAt: string; // ISO 8601
  model: string | null;
  usage: AnalysisUsage | null;
}
