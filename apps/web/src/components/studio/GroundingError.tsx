import { AlertTriangle } from "lucide-react";

import type { StudioError } from "@/types/studio";

export function GroundingError({ error }: { error: StudioError }) {
  return (
    <div role="alert" className="rounded-2xl border border-danger/30 bg-[#fbe9ec] p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-danger">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        {error.message}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-danger/80">{error.hint}</p>
    </div>
  );
}
