import { ClipboardCheck, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { StatusPill } from "@/components/design/StatusPill";

const PHASES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ClipboardCheck,
    title: "Action plan",
    body: "Draft a constrained, fictional digital action for review. Not yet available.",
  },
  {
    icon: UserCheck,
    title: "Approval & audit",
    body: "Approve an action, bound to its exact hash, recorded in an audit log. Not yet available.",
  },
];

/** Honest placeholders for later phases — never implies these work yet. */
export function FuturePhases() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">What&apos;s next</h3>
        <StatusPill tone="purple">Planned</StatusPill>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {PHASES.map((p) => (
          <div
            key={p.title}
            className="flex flex-col gap-1.5 rounded-2xl border border-dashed border-line bg-cloud/60 p-4"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-muted">
              <p.icon className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-ink-soft">{p.title}</p>
            <p className="text-xs text-muted">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
