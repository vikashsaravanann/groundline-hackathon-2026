import { cn } from "@/lib/utils";
import type { StudioStatus } from "@/types/studio";

interface Step {
  key: string;
  label: string;
  planned?: boolean;
}

const STEPS: Step[] = [
  { key: "capture", label: "Capture" },
  { key: "analyze", label: "Analyze" },
  { key: "ground", label: "Ground", planned: true },
  { key: "prepare", label: "Prepare", planned: true },
  { key: "review", label: "Review", planned: true },
];

function activeKey(status: StudioStatus): string {
  if (status === "validating" || status === "analyzing") return "analyze";
  if (status === "completed") return "analyze";
  return "capture";
}

export function WorkflowProgress({ status }: { status: StudioStatus }) {
  const active = activeKey(status);
  const activeIndex = STEPS.findIndex((s) => s.key === active);
  const captureDone = status === "captured" || status === "completed" ||
    status === "validating" || status === "analyzing";
  const analyzeDone = status === "completed";

  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm" aria-label="Workflow progress">
      {STEPS.map((step, i) => {
        const isActive = i === activeIndex && !step.planned;
        const done =
          (step.key === "capture" && captureDone) || (step.key === "analyze" && analyzeDone);
        return (
          <li key={step.key} className="flex items-center gap-2">
            <span
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                step.planned
                  ? "bg-cloud text-muted"
                  : done
                    ? "bg-success text-white"
                    : isActive
                      ? "bg-navy text-white"
                      : "bg-blue-light text-navy",
              )}
            >
              {step.label}
              {step.planned && <span className="font-normal opacity-80">· soon</span>}
            </span>
            {i < STEPS.length - 1 && <span aria-hidden className="text-line">→</span>}
          </li>
        );
      })}
    </ol>
  );
}
