"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { API_BASE } from "@/lib/config";
import { captureSnapshot } from "@/lib/snapshot";
import type {
  AnalyzeResponse,
  CaptureError,
  CaptureState,
  Snapshot,
} from "@/lib/types";

export interface Seed {
  state: CaptureState;
  mode?: string;
}

export interface Machine {
  state: CaptureState;
  snapshot: Snapshot | null;
  result: AnalyzeResponse | null;
  error: CaptureError | null;
  objective: string;
  isPreview: boolean;
  setObjective: (v: string) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capture: () => Promise<void>;
  analyze: () => Promise<void>;
  retake: () => void;
  reset: () => void;
}

const PREVIEW_STATES: CaptureState[] = ["capturing", "uploading", "analyzing", "result"];

// A 4:3 placeholder used only for dev-seeded previews (never a real photo).
const SAMPLE_SNAPSHOT: Snapshot = {
  dataUrl:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='240'>
        <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#1e293b'/><stop offset='1' stop-color='#0f172a'/>
        </linearGradient></defs>
        <rect width='320' height='240' fill='url(#g)'/>
        <text x='160' y='120' fill='#64748b' font-family='sans-serif' font-size='16'
         text-anchor='middle'>sample still (preview)</text></svg>`,
    ),
  base64: "",
  mimeType: "image/jpeg",
  bytes: 48213,
  width: 320,
  height: 240,
};

function sampleResult(mode?: string): AnalyzeResponse {
  return {
    mode: mode === "live" ? "live" : "MOCK",
    model: "muse-spark-1.3",
    objective_length: 42,
    facts: [
      { label: "product_name", value: "ACME Oat Drink Barista", confidence: 1 },
      { label: "size", value: "1 L", confidence: 0.98 },
      { label: "best-before date", value: "2027-02-14", confidence: 0.95 },
    ],
    overall_confidence: 0.97,
    usage: {
      input_tokens: 132,
      output_tokens: 259,
      total_tokens: 391,
      estimated_cost_usd: 0.001266,
    },
    elapsed_ms: 2795,
  };
}

const SAMPLE_ERROR: CaptureError = {
  kind: "permission-denied",
  message: "Camera permission was denied.",
  hint: "Open your browser's site settings, allow camera access for this page, then press Start camera again.",
};

function classifyGetUserMediaError(err: unknown): CaptureError {
  const name = (err as DOMException | undefined)?.name;
  if (name === "NotAllowedError" || name === "SecurityError") {
    return {
      kind: "permission-denied",
      message: "Camera permission was denied.",
      hint: "Open your browser's site settings, allow camera access for this page, then press Start camera again.",
    };
  }
  if (
    name === "NotFoundError" ||
    name === "DevicesNotFoundError" ||
    name === "OverconstrainedError"
  ) {
    return {
      kind: "no-camera",
      message: "No camera was found on this device.",
      hint: "Connect a camera, or switch to a device that has one, then press Start camera.",
    };
  }
  return {
    kind: "unknown",
    message: "The camera could not be started.",
    hint: "Check that no other app is using the camera, then try again.",
  };
}

export function useCaptureMachine(seed?: Seed): Machine {
  const isPreview = Boolean(seed);
  const [state, setState] = useState<CaptureState>(seed?.state ?? "idle");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(
    seed && PREVIEW_STATES.includes(seed.state) ? SAMPLE_SNAPSHOT : null,
  );
  const [result, setResult] = useState<AnalyzeResponse | null>(
    seed?.state === "result" ? sampleResult(seed.mode) : null,
  );
  const [error, setError] = useState<CaptureError | null>(
    seed?.state === "error" ? SAMPLE_ERROR : null,
  );
  const [objective, setObjective] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Always release the camera when the component unmounts.
  useEffect(() => stopStream, [stopStream]);

  const startCamera = useCallback(async () => {
    if (isPreview) return;
    setError(null);
    setResult(null);
    setSnapshot(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState("error");
      setError({
        kind: "unsupported",
        message: "This browser does not support camera capture.",
        hint: "Use a recent Chrome, Edge, Firefox or Safari, over https or localhost.",
      });
      return;
    }

    setState("requesting-permission");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        await v.play().catch(() => {});
      }
      setState("ready");
    } catch (err) {
      stopStream();
      setState("error");
      setError(classifyGetUserMediaError(err));
    }
  }, [isPreview, stopStream]);

  const stopCamera = useCallback(() => {
    stopStream();
    setSnapshot(null);
    setState("idle");
  }, [stopStream]);

  const capture = useCallback(async () => {
    if (isPreview) return;
    const v = videoRef.current;
    if (!v) return;
    setState("capturing");
    try {
      const snap = await captureSnapshot(v);
      setSnapshot(snap);
      // Stay in "capturing": the still is now previewed, awaiting an explicit
      // Analyze click. Nothing is uploaded automatically.
    } catch (err) {
      setState("error");
      setError({
        kind: "validation",
        message: err instanceof Error ? err.message : "Could not capture the frame.",
        hint: "Press Retake to capture another still.",
      });
    }
  }, [isPreview]);

  const analyze = useCallback(async () => {
    if (isPreview || !snapshot) return;
    setError(null);
    setResult(null);
    setState("uploading");

    // Let the uploading state paint for a frame before we switch to analyzing.
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    try {
      const body = JSON.stringify({
        objective,
        mime_type: snapshot.mimeType,
        image_base64: snapshot.base64,
      });
      const pending = fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      // Request dispatched; now we are waiting on the model.
      setState("analyzing");
      const resp = await pending;

      if (!resp.ok) {
        let detail = `The server responded with ${resp.status}.`;
        try {
          const j = await resp.json();
          if (j?.detail) {
            detail = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
          }
        } catch {
          /* keep the generic status message */
        }
        setState("error");
        setError({
          kind: resp.status >= 500 ? "model" : "validation",
          message: detail,
          hint: "Adjust the objective or capture a clearer still, then try again.",
        });
        return;
      }

      const data = (await resp.json()) as AnalyzeResponse;
      // Success is only rendered after the response has resolved — never before.
      setResult(data);
      setState("result");
    } catch {
      setState("error");
      setError({
        kind: "network",
        message: "Could not reach the Groundline backend.",
        hint: `Is the API running at ${API_BASE}? Start it, then try again.`,
      });
    }
  }, [isPreview, snapshot, objective]);

  const retake = useCallback(() => {
    if (isPreview) return;
    setSnapshot(null);
    setResult(null);
    setError(null);
    setState(streamRef.current ? "ready" : "idle");
  }, [isPreview]);

  const reset = useCallback(() => {
    if (isPreview) return;
    stopStream();
    setSnapshot(null);
    setResult(null);
    setError(null);
    setState("idle");
  }, [isPreview, stopStream]);

  return {
    state,
    snapshot,
    result,
    error,
    objective,
    isPreview,
    setObjective,
    videoRef,
    startCamera,
    stopCamera,
    capture,
    analyze,
    retake,
    reset,
  };
}
