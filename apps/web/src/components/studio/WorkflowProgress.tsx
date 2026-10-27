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
    <div
      className="w-full overflow-x-auto pb-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-accent"
      role="region"
      aria-label="Workflow steps"
      tabIndex={0}
    >
      <ol className="mx-auto flex min-w-[640px] w-full max-w-5xl items-center text-sm">
        {STEPS.map((step, i) => {
          const isActive = i === activeIndex && !step.planned;
          const done =
            (step.key === "capture" && captureDone) ||
            (step.key === "analyze" && analyzeDone);
          return (
            <li key={step.key} className="relative flex min-w-0 flex-1 justify-center">
              <span
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold sm:px-4",
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
              {i < STEPS.length - 1 && (
                <span aria-hidden className="absolute right-0 translate-x-1/2 text-line">
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
