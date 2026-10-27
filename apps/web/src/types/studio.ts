// The Studio is modelled as an explicit state machine, not an ambiguous boolean.

export type StudioStatus =
  | "idle"
  | "requesting-camera"
  | "camera-ready"
  | "captured"
  | "validating"
  | "analyzing"
  | "completed"
  | "error";

export type CameraPermission =
  | "unknown"
  | "prompting"
  | "granted"
  | "denied"
  | "no-camera"
  | "unsupported"
  | "in-use";

export interface SelectedImage {
  dataUrl: string;
  base64: string;
  mimeType: string;
  bytes: number;
  width: number;
  height: number;
  origin: "camera" | "upload";
}

export type StudioErrorKind =
  | "permission"
  | "no-camera"
  | "unsupported"
  | "validation"
  | "network"
  | "model"
  | "timeout"
  | "unknown";

export interface StudioError {
  kind: StudioErrorKind;
  message: string;
  hint: string;
}
