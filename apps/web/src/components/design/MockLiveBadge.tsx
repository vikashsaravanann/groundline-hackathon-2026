import { FlaskConical, Zap } from "lucide-react";

import { StatusPill } from "./StatusPill";
import type { AnalysisSource } from "@/types/analysis";

/**
 * Shows LIVE only for an actual successful Meta response (source "meta-live").
 * Everything else is a fixture and is announced as MOCK (SECURITY.md rule 7).
 * The /healthz operating mode is never used as proof of a live inference.
 */
export function MockLiveBadge({ source }: { source: AnalysisSource }) {
  if (source === "meta-live") {
    return (
      <StatusPill tone="live" role="status" icon={<Zap className="h-3.5 w-3.5" />}>
        LIVE — Meta model response
      </StatusPill>
    );
  }
  return (
    <StatusPill tone="mock" role="status" icon={<FlaskConical className="h-3.5 w-3.5" />}>
      MOCK — fixture, not a live model call
    </StatusPill>
  );
}
