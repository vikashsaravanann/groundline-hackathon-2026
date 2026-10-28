"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { ApiError, analyzeImage } from "@/lib/api";
import { groundImage } from "@/lib/grounding";
import { MAX_OBJECTIVE_CHARS } from "@/lib/config";
import { captureFromVideo, imageFromFile } from "@/lib/image";
import type { AnalysisResult } from "@/types/analysis";
import type { GroundingResult } from "@/types/grounding";
import type { GroundingStatus, SelectedImage, StudioError, StudioStatus } from "@/types/studio";
import { type CameraController, useCamera } from "./useCamera";

export interface Studio {
  status: StudioStatus;
  capturing: boolean;
  camera: CameraController;
  image: SelectedImage | null;
  objective: string;
  result: AnalysisResult | null;
  groundingStatus: GroundingStatus;
  groundingResult: GroundingResult | null;
  groundingError: StudioError | null;
  selectedGroundingObjectId: string | null;
  targetPhrase: string;
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
  setTargetPhrase: (value: string) => void;
  ground: (accessToken?: string) => Promise<void>;
  cancelGrounding: () => void;
  clearGrounding: () => void;
  selectGroundingObject: (id: string | null) => void;
  reset: () => void;
}

export function useStudio(): Studio {
  const camera = useCamera();
  const [status, setStatus] = useState<StudioStatus>("idle");
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [objective, setObjective] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [groundingStatus, setGroundingStatus] = useState<GroundingStatus>("idle");
  const [groundingResult, setGroundingResult] = useState<GroundingResult | null>(null);
  const [groundingError, setGroundingError] = useState<StudioError | null>(null);
  const [selectedGroundingObjectId, setSelectedGroundingObjectId] = useState<string | null>(null);
  const [targetPhrase, setTargetPhraseState] = useState("");
  const [error, setError] = useState<StudioError | null>(null);
  const [capturing, setCapturing] = useState(false);
  const captureInProgress = useRef(false);

  // Guards against a stale response landing after cancel / a newer request.
  const requestSeq = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const groundingSeq = useRef(0);
  const groundingAbortRef = useRef<AbortController | null>(null);
  const imageRef = useRef<SelectedImage | null>(null);
  const targetPhraseRef = useRef("");

  const clearGrounding = useCallback(() => {
    groundingSeq.current++;
    groundingAbortRef.current?.abort();
    groundingAbortRef.current = null;
    setGroundingStatus("idle");
    setGroundingResult(null);
    setGroundingError(null);
    setSelectedGroundingObjectId(null);
  }, []);

  const setSelectedImage = useCallback((next: SelectedImage | null) => {
    imageRef.current = next;
    setImage(next);
    clearGrounding();
  }, [clearGrounding]);

  const setTargetPhrase = useCallback((value: string) => {
    targetPhraseRef.current = value;
    setTargetPhraseState(value);
    clearGrounding();
    setGroundingStatus(value.trim() ? "ready" : "idle");
  }, [clearGrounding]);

  const objectiveValid = useMemo(() => {
    const len = objective.trim().length;
    return len > 0 && objective.length <= MAX_OBJECTIVE_CHARS;
  }, [objective]);

  const canAnalyze = Boolean(image) && objectiveValid && status !== "analyzing";

  const startCamera = useCallback(async () => {
    // Retake must remove the previous still before requesting a fresh stream;
    // otherwise the still-preview branch hides the newly attached video.
    setSelectedImage(null);
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
  }, [camera, setSelectedImage]);

  const stopCamera = useCallback(() => {
    camera.stop();
    setStatus(image ? "captured" : "idle");
  }, [camera, image]);

  const capture = useCallback(async (captureFrame?: HTMLElement | null) => {
    if (captureInProgress.current) return;
    const v = camera.videoRef.current;
    if (!v || !camera.active) return;
    captureInProgress.current = true;
    setCapturing(true);
    try {
      const snap = await captureFromVideo(v, captureFrame);
      setSelectedImage(snap);
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
    } finally {
      captureInProgress.current = false;
      setCapturing(false);
    }
  }, [camera, setSelectedImage]);

  const selectFile = useCallback(async (file: File) => {
    setStatus("validating");
    setError(null);
    setResult(null);
    clearGrounding();
    try {
      const img = await imageFromFile(file);
      setSelectedImage(img);
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
  }, [camera, setSelectedImage, clearGrounding]);

  const removeImage = useCallback(() => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    setStatus("idle");
  }, [setSelectedImage]);

  const analyze = useCallback(async () => {
    if (!image || !objectiveValid) return;
    // A fresh analysis invalidates both an older analysis and any SAM request
    // associated with its image/target before new work starts.
    abortRef.current?.abort();
    clearGrounding();
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
      const suggestedTarget = res.targetPhrase?.trim() || res.detectedObject?.trim() || "";
      targetPhraseRef.current = suggestedTarget;
      setTargetPhraseState(suggestedTarget);
      clearGrounding();
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
  }, [image, objective, objectiveValid, clearGrounding]);

  const cancel = useCallback(() => {
    requestSeq.current++; // invalidate the in-flight response
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus(image ? "captured" : "idle");
  }, [image]);

  const cancelGrounding = useCallback(() => {
    groundingSeq.current++;
    groundingAbortRef.current?.abort();
    groundingAbortRef.current = null;
    setGroundingStatus("cancelled");
  }, []);

  const selectGroundingObject = useCallback((id: string | null) => {
    setSelectedGroundingObjectId(id);
  }, []);

  const ground = useCallback(async (accessToken?: string) => {
    if (!image || !result || status !== "completed") return;
    const phrase = targetPhrase.trim();
    if (!phrase) {
      setGroundingStatus("error");
      setGroundingError({ kind: "validation", message: "Enter one object to ground.", hint: "Use a short noun phrase such as desk lamp." });
      return;
    }
    const sequence = ++groundingSeq.current;
    const sourceImage = image;
    groundingAbortRef.current?.abort();
    const controller = new AbortController();
    groundingAbortRef.current = controller;
    setGroundingResult(null);
    setSelectedGroundingObjectId(null);
    setGroundingStatus("grounding");
    setGroundingError(null);
    try {
      const grounded = await groundImage({
        base64: sourceImage.base64,
        mimeType: sourceImage.mimeType,
        width: sourceImage.width,
        height: sourceImage.height,
        targetPhrase: phrase,
        accessToken,
        signal: controller.signal,
      });
      if (sequence !== groundingSeq.current || imageRef.current?.base64 !== sourceImage.base64 || targetPhraseRef.current.trim() !== phrase) return;
      setGroundingResult(grounded);
      setSelectedGroundingObjectId(grounded.objects.length === 1 ? grounded.objects[0].objectId : null);
      setGroundingStatus(
        grounded.status === "no_match" ? "no-match"
          : grounded.status === "mock_unavailable" ? "mock-unavailable"
            : grounded.status === "multiple_candidates" ? "multiple-candidates"
              : "completed",
      );
    } catch (err) {
      if (sequence !== groundingSeq.current) return;
      const failure: StudioError = err instanceof ApiError
        ? { kind: err.kind, message: err.message, hint: err.hint }
        : { kind: "unknown", message: err instanceof Error ? err.message : "Grounding failed.", hint: "Check the image and try again only after confirming the previous request ended." };
      if (failure.message.includes("cancelled")) {
        setGroundingStatus("cancelled");
        return;
      }
      setGroundingError(failure);
      setGroundingStatus("error");
    } finally {
      if (groundingAbortRef.current === controller) groundingAbortRef.current = null;
    }
  }, [image, result, status, targetPhrase]);

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
    setResult((prev) => {
      if (!prev) return prev;
      const field = prev.fields.find((candidate) => candidate.id === id);
      if (!field || (field.value ?? "") === value) return prev;
      return {
        ...prev,
        correctionEvents: [...prev.correctionEvents, {
          id: `${Date.now()}-${prev.correctionEvents.length}`,
          fieldId: field.id,
          label: field.label,
          timestamp: new Date().toISOString(),
          originalValue: field.modelValue,
          correctedValue: value,
        }],
        fields: prev.fields.map((candidate) =>
          candidate.id === id ? { ...candidate, value, userConfirmed: true } : candidate,
        ),
      };
    });
  }, []);

  const reset = useCallback(() => {
    requestSeq.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    camera.stop();
    setSelectedImage(null);
    setResult(null);
    setError(null);
    targetPhraseRef.current = "";
    setTargetPhraseState("");
    clearGrounding();
    // Keep the objective: a recoverable reset should not lose the user's words.
    setStatus("idle");
  }, [camera, setSelectedImage, clearGrounding]);

  return {
    status,
    capturing,
    camera,
    image,
    objective,
    result,
    groundingStatus,
    groundingResult,
    groundingError,
    selectedGroundingObjectId,
    targetPhrase,
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
    setTargetPhrase,
    ground,
    cancelGrounding,
    clearGrounding,
    selectGroundingObject,
    reset,
  };
}
