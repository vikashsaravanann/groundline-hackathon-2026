import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/design/Button";
import type { StudioError } from "@/types/studio";

export function AnalysisError({
  error,
  onRetry,
}: {
  error: StudioError;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-2xl border border-danger/30 bg-[#fbe9ec] p-5"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-danger">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-danger">{error.message}</p>
        <p className="text-sm text-danger/80">{error.hint}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
