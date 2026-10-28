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

export interface GroundingResult {
  mode: "live" | "MOCK";
  provider: string;
  model: string;
  status: "completed" | "no_match" | "mock_unavailable";
  imageWidth: number;
  imageHeight: number;
  imageSha256: string;
  targetPhrase: string;
  objects: GroundedObject[];
  diagnostics: Array<{ severity: string; code: string; message: string }>;
  correlationId: string;
  responseId: string | null;
  elapsedMs: number;
  estimatedCostUsd: number;
}
