"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CameraPermission, StudioError } from "@/types/studio";

export interface StartResult {
  ok: boolean;
  error?: StudioError;
}

export interface CameraController {
  permission: CameraPermission;
  active: boolean;
  hasMultipleCameras: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  start: () => Promise<StartResult>;
  stop: () => void;
  switchCamera: () => Promise<void>;
}

function classify(err: unknown): { perm: CameraPermission; error: StudioError } {
  const name = (err as DOMException | undefined)?.name;
  if (name === "NotAllowedError" || name === "SecurityError") {
    return {
      perm: "denied",
      error: {
        kind: "permission",
        message: "Camera permission was denied.",
        hint: "Allow camera access in your browser's site settings, or upload an image instead.",
      },
    };
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") {
    return {
      perm: "no-camera",
      error: {
        kind: "no-camera",
        message: "No camera was found on this device.",
        hint: "Connect a camera, or upload an image instead.",
      },
    };
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return {
      perm: "in-use",
      error: {
        kind: "unknown",
        message: "The camera is already in use by another app.",
        hint: "Close any app using the camera, then try again — or upload an image.",
      },
    };
  }
  return {
    perm: "denied",
    error: {
      kind: "unknown",
      message: "The camera could not be started.",
      hint: "Check your camera and try again, or upload an image instead.",
    },
  };
}

export function useCamera(): CameraController {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const facingRef = useRef<"environment" | "user">("environment");
  const [permission, setPermission] = useState<CameraPermission>("unknown");
  const [active, setActive] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }, []);

  // Always release the camera on unmount.
  useEffect(() => stop, [stop]);

  const attach = useCallback(async (facing: "environment" | "user") => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: facing,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30, max: 30 },
      },
      audio: false,
    });
    streamRef.current = stream;
    // Prefer continuous autofocus when the device exposes it. Unsupported
    // camera controls are best-effort and must not block the preview.
    const track = stream.getVideoTracks()[0];
    if (track && typeof track.getCapabilities === "function") {
      try {
        const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
          focusMode?: string[];
        };
        if (capabilities.focusMode?.includes("continuous")) {
          await track
            .applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] })
            .catch(() => {});
        }
      } catch {
        // Camera focus controls vary by browser/device; preview remains usable.
      }
    }
    const v = videoRef.current;
    if (v) {
      v.srcObject = stream;
      await v.play().catch(() => {});
    }
    setActive(true);
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setHasMultipleCameras(devices.filter((d) => d.kind === "videoinput").length > 1);
    } catch {
      /* enumeration is best-effort */
    }
  }, []);

  const start = useCallback(async (): Promise<StartResult> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPermission("unsupported");
      return {
        ok: false,
        error: {
          kind: "unsupported",
          message: "This browser does not support camera capture.",
          hint: "Use a recent Chrome, Edge, Firefox or Safari over https or localhost — or upload an image.",
        },
      };
    }
    setPermission("prompting");
    try {
      await attach(facingRef.current);
      setPermission("granted");
      return { ok: true };
    } catch (err) {
      stop();
      const { perm, error } = classify(err);
      setPermission(perm);
      return { ok: false, error };
    }
  }, [attach, stop]);

  const switchCamera = useCallback(async () => {
    facingRef.current = facingRef.current === "environment" ? "user" : "environment";
    stop();
    try {
      await attach(facingRef.current);
      setPermission("granted");
    } catch {
      stop();
    }
  }, [attach, stop]);

  return { permission, active, hasMultipleCameras, videoRef, start, stop, switchCamera };
}
