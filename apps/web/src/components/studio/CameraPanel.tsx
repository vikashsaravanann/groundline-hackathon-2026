"use client";

import { Camera, CircleStop, RefreshCw, SwitchCamera, Trash2 } from "lucide-react";

import { Button } from "@/components/design/Button";
import { StatusPill } from "@/components/design/StatusPill";
import { cn } from "@/lib/utils";
import type { Studio } from "@/hooks/useStudio";
import { UploadDropzone } from "./UploadDropzone";

export function CameraPanel({ studio }: { studio: Studio }) {
  const { status, camera, image } = studio;
  // Destructure the ref into its own binding so reads of the other camera
  // members aren't flagged as ref access during render.
  const { active, hasMultipleCameras, videoRef, switchCamera } = camera;
  const showVideo = active && !image;
  const showPreview = image !== null;
  const requesting = status === "requesting-camera";
  const cameraError = status === "error" && !image ? studio.error : null;
  const showConsent = !showVideo && !showPreview && !requesting;

  return (
    <section
      aria-label="Capture"
      className="glass-panel flex flex-col gap-4 rounded-[28px] p-5 sm:p-6"
    >
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        <h2 className="text-base font-semibold text-ink">Capture</h2>
        {showVideo && (
          <StatusPill tone="danger" icon={<span className="h-2 w-2 animate-pulse rounded-full bg-white" />}>
            Camera on
          </StatusPill>
        )}
        {showPreview && (
          <StatusPill tone="neutral">{image.origin === "camera" ? "Snapshot" : "Uploaded"}</StatusPill>
        )}
      </div>

      {/* Viewport */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line bg-cloud">
        {/* Always mounted so the ref is stable before the stream attaches. */}
        <video
          ref={videoRef}
          playsInline
          muted
          aria-label="Live camera preview"
          className={cn("h-full w-full object-cover", showVideo ? "block" : "hidden")}
        />

        {showVideo && (
          <div aria-hidden className="pointer-events-none absolute inset-6 rounded-xl border-2 border-dashed border-white/70" />
        )}

        {showPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.dataUrl}
            alt="Captured image to analyze"
            className="absolute inset-0 h-full w-full object-contain"
          />
        )}

        {requesting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-blue-accent" />
            <p className="text-sm text-ink-soft">Waiting for you to allow camera access…</p>
          </div>
        )}

        {showConsent && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-light text-navy">
              <Camera className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold text-ink">
              Show Groundline what you&apos;re working with.
            </p>
            <p className="max-w-xs text-xs text-muted">
              Use your camera to take one still, or upload an image. The camera
              only starts when you ask it to.
            </p>
          </div>
        )}
      </div>

      {cameraError && (
        <div role="alert" className="rounded-2xl border border-danger/30 bg-[#fbe9ec] p-3">
          <p className="text-sm font-semibold text-danger">{cameraError.message}</p>
          <p className="text-xs text-danger/80">{cameraError.hint}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-3">
        {showConsent && (
          <>
            <Button size="lg" onClick={studio.startCamera} className="w-full">
              <Camera className="h-4 w-4" />
              Start camera
            </Button>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>
            <UploadDropzone onFile={studio.selectFile} />
          </>
        )}

        {requesting && (
          <Button variant="secondary" disabled className="w-full">
            Requesting permission…
          </Button>
        )}

        {showVideo && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={studio.capture} className="flex-1">
              <Camera className="h-4 w-4" />
              Capture snapshot
            </Button>
            {hasMultipleCameras && (
              <Button variant="secondary" onClick={switchCamera} aria-label="Switch camera">
                <SwitchCamera className="h-4 w-4" />
              </Button>
            )}
            <Button variant="danger" onClick={studio.stopCamera}>
              <CircleStop className="h-4 w-4" />
              Stop
            </Button>
          </div>
        )}

        {showPreview && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={studio.startCamera} className="flex-1">
              <RefreshCw className="h-4 w-4" />
              Retake
            </Button>
            <Button variant="ghost" onClick={studio.removeImage}>
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
