// Application-level analysis contract. The backend's raw response is adapted
// into this shape (see lib/normalize.ts); the UI never assumes the model
// produces this object directly.

export type AnalysisSource = "meta-live" | "mock" | "unavailable";

export interface AnalysisField {
  id: string;
  label: string;
  /** Immutable value returned by the model, retained for correction history. */
  modelValue: string | null;
  value: string | null;
  /** Model-reported, never invented. null → shown as "Not evaluated". */
  confidence: number | null;
  /** Per-field evidence when the backend supplies it; otherwise null. */
  evidence: string | null;
  userConfirmed: boolean;
}

export interface ImageRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CorrectionEvent {
  id: string;
  fieldId: string;
  label: string;
  timestamp: string;
  originalValue: string | null;
  correctedValue: string;
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
  status: "completed" | "partial" | "refused";
  refusalMessage: string | null;
  summary: string;
  detectedObject: string | null;
  fields: AnalysisField[];
  cautions: string[];
  analyzedAt: string; // ISO 8601
  model: string | null;
  usage: AnalysisUsage | null;
  targetFound: boolean;
  targetRegion: ImageRegion | null;
  targetPhrase: string | null;
  correctionEvents: CorrectionEvent[];
}
