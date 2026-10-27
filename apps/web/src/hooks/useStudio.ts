"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { ApiError, analyzeImage } from "@/lib/api";
import { MAX_OBJECTIVE_CHARS } from "@/lib/config";
import { captureFromVideo, imageFromFile } from "@/lib/image";
import type { AnalysisResult } from "@/types/analysis";
import type { SelectedImage, StudioError, StudioStatus } from "@/types/studio";
import { type CameraController, useCamera } from "./useCamera";

export interface Studio {
  status: StudioStatus;
  camera: CameraController;
  image: SelectedImage | null;
  objective: string;
  result: AnalysisResult | null;
  error: StudioError | null;
  objectiveValid: boolean;
  canAnalyze: boolean;
  setObjective: (v: string) => void;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capture: (captureFrame?: HTMLElement | null) => Promise<void>;
  selectFile: (file: File) => Promise<void>;
  removeImage: () => void;
  analyze: () => Promise<void>;
  cancel: () => void;
  confirmField: (id: string) => void;
  editField: (id: string, value: string) => void;
  reset: () => void;
}

export function useStudio(): Studio {
  const camera = useCamera();
  const [status, setStatus] = useState<StudioStatus>("idle");
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [objective, setObjective] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<StudioError | null>(null);

  // Guards against a stale response landing after cancel / a newer request.
  const requestSeq = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const objectiveValid = useMemo(() => {
    const len = objective.trim().length;
    return len > 0 && objective.length <= MAX_OBJECTIVE_CHARS;
  }, [objective]);

  const canAnalyze = Boolean(image) && objectiveValid && status !== "analyzing";

  const startCamera = useCallback(async () => {
    setError(null);
    setResult(null);
    setStatus("requesting-camera");
    const r = await camera.start();
    if (r.ok) {
      setStatus("camera-ready");
    } else {
      setStatus("error");
      setError(r.error ?? null);
    }
  }, [camera]);

  const stopCamera = useCallback(() => {
    camera.stop();
    setStatus(image ? "captured" : "idle");
  }, [camera, image]);

  const capture = useCallback(async (captureFrame?: HTMLElement | null) => {
    const v = camera.videoRef.current;
    if (!v) return;
    try {
      const snap = await captureFromVideo(v, captureFrame);
      setImage(snap);
      camera.stop(); // pause the stream once we have the still
      setResult(null);
      setError(null);
      setStatus("captured");
    } catch (err) {
      setStatus("error");
      setError({
        kind: "validation",
        message: err instanceof Error ? err.message : "Could not capture the frame.",
        hint: "Press Retake to capture another still.",
      });
    }
  }, [camera]);

  const selectFile = useCallback(async (file: File) => {
    setStatus("validating");
    setError(null);
    setResult(null);
    try {
      const img = await imageFromFile(file);
      setImage(img);
      camera.stop();
      setStatus("captured");
    } catch (err) {
      setStatus("error");
      setError({
        kind: "validation",
        message: err instanceof Error ? err.message : "That image could not be used.",
        hint: "Choose a PNG, JPEG or WebP image under 4 MB of content.",
      });
    }
  }, [camera]);

  const removeImage = useCallback(() => {
    setImage(null);
    setResult(null);
    setError(null);
    setStatus("idle");
  }, []);

  const analyze = useCallback(async () => {
    if (!image || !objectiveValid) return;
    const seq = ++requestSeq.current;
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setStatus("analyzing");
    try {
      const res = await analyzeImage({
        base64: image.base64,
        mimeType: image.mimeType,
        objective,
        signal: controller.signal,
      });
      if (seq !== requestSeq.current) return; // a newer request / cancel won
      setResult(res);
      setStatus("completed");
    } catch (err) {
      if (seq !== requestSeq.current) return; // cancelled; ignore
      const studioError: StudioError =
        err instanceof ApiError
          ? { kind: err.kind, message: err.message, hint: err.hint }
          : {
              kind: "unknown",
              message: "Something went wrong during analysis.",
              hint: "Please try again.",
            };
      // A cancel surfaces as an abort — keep the user on the captured state.
      if (studioError.message === "The request was cancelled.") {
        setStatus("captured");
        return;
      }
      setStatus("error");
      setError(studioError);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [image, objective, objectiveValid]);

  const cancel = useCallback(() => {
    requestSeq.current++; // invalidate the in-flight response
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus(image ? "captured" : "idle");
  }, [image]);

  const confirmField = useCallback((id: string) => {
    setResult((prev) =>
      prev
        ? {
            ...prev,
            fields: prev.fields.map((f) =>
              f.id === id ? { ...f, userConfirmed: !f.userConfirmed } : f,
            ),
          }
        : prev,
    );
  }, []);

  const editField = useCallback((id: string, value: string) => {
    setResult((prev) =>
      prev
        ? {
            ...prev,
            fields: prev.fields.map((f) =>
              f.id === id ? { ...f, value, userConfirmed: true } : f,
            ),
          }
        : prev,
    );
  }, []);

  const reset = useCallback(() => {
    requestSeq.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    camera.stop();
    setImage(null);
    setResult(null);
    setError(null);
    // Keep the objective: a recoverable reset should not lose the user's words.
    setStatus("idle");
  }, [camera]);

  return {
    status,
    camera,
    image,
    objective,
    result,
    error,
    objectiveValid,
    canAnalyze,
    setObjective,
    startCamera,
    stopCamera,
    capture,
    selectFile,
    removeImage,
    analyze,
    cancel,
    confirmField,
    editField,
    reset,
  };
}
