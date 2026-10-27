// The capture flow is an explicit state machine with exactly these states.
export type CaptureState =
  | "idle"
  | "requesting-permission"
  | "ready"
  | "capturing"
  | "uploading"
  | "analyzing"
  | "result"
  | "error";

export const CAPTURE_STATES: CaptureState[] = [
  "idle",
  "requesting-permission",
  "ready",
  "capturing",
  "uploading",
  "analyzing",
  "result",
  "error",
];

export interface Snapshot {
  dataUrl: string;
  base64: string;
  mimeType: string;
  bytes: number;
  width: number;
  height: number;
}

export interface Fact {
  label: string;
  value: string;
  confidence: number;
}

export interface Usage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
}

export interface AnalyzeResponse {
  mode: string; // "MOCK" | "live"
  model: string;
  objective_length: number;
  facts: Fact[];
  overall_confidence: number;
  usage: Usage;
  elapsed_ms: number;
}

export type ErrorKind =
  | "permission-denied"
  | "no-camera"
  | "unsupported"
  | "validation"
  | "network"
  | "model"
  | "unknown";

export interface CaptureError {
  kind: ErrorKind;
  message: string;
  hint: string;
}
