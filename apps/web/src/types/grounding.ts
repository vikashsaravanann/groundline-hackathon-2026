export interface GroundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GroundingMask {
  encoding: "svg-path";
  path: string;
  width: number;
  height: number;
  bounds: GroundingBox;
}

export interface GroundedObject {
  objectId: string;
  label: string;
  box: GroundingBox;
  mask: GroundingMask | null;
  score: number | null;
}

export interface GroundingEvidenceRegion {
  box: GroundingBox;
  sourceModel: string;
  confidence: number | null;
  mode: "live" | "MOCK";
  mask: GroundingMask | null;
  fieldName: string | null;
  value: string | null;
}

export interface GroundingStageUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  imagesProcessed: number;
}

export interface GroundingResult {
  mode: "live" | "MOCK";
  provider: string;
  model: string;
  status: "completed" | "no_match" | "mock_unavailable" | "multiple_candidates";
  imageWidth: number;
  imageHeight: number;
  imageSha256: string;
  targetPhrase: string;
  objects: GroundedObject[];
  labelRegion: GroundingEvidenceRegion | null;
  fieldRegion: GroundingEvidenceRegion | null;
  fieldStatus: "found" | "no_position" | "unavailable" | "not_attempted";
  samUsage: GroundingStageUsage;
  sparkUsage: GroundingStageUsage | null;
  samEstimatedCostUsd: number;
  sparkEstimatedCostUsd: number | null;
  diagnostics: Array<{ severity: string; code: string; message: string }>;
  correlationId: string;
  responseId: string | null;
  elapsedMs: number;
  estimatedCostUsd: number | null;
}
