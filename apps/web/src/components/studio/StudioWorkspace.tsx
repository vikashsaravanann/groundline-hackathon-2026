"use client";

import { useStudio } from "@/hooks/useStudio";
import { AnalysisPanel } from "./AnalysisPanel";
import { CameraPanel } from "./CameraPanel";
import { IntentComposer } from "./IntentComposer";
import { WorkflowProgress } from "./WorkflowProgress";
import { GroundingPanel } from "./GroundingPanel";

export function StudioWorkspace() {
  const studio = useStudio();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Turn what you see into your next step.
        </h1>
        <p className="text-sm text-ink-soft">
          Show a product label and describe what you want to do.
        </p>
      </header>

      <div className="mt-6">
        <WorkflowProgress status={studio.status} groundingStatus={studio.groundingStatus} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col gap-5">
          <CameraPanel studio={studio} />
          <IntentComposer studio={studio} />
        </div>
        <AnalysisPanel studio={studio} />
      </div>
      <div className="mt-5">
        <GroundingPanel studio={studio} />
      </div>
    </div>
  );
}
