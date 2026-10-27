import { CheckCircle2, ScanLine, ShieldCheck } from "lucide-react";

import { GlassPanel } from "@/components/design/GlassPanel";
import { StatusPill } from "@/components/design/StatusPill";

/**
 * An illustrative composition built from real UI primitives. It is explicitly
 * labelled as a preview and never presented as a completed AI inference.
 */
export function HeroPreview() {
  return (
    <div className="relative">
      <GlassPanel className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <StatusPill tone="purple" icon={<ScanLine className="h-3.5 w-3.5" />}>
            Illustrative workflow preview
          </StatusPill>
          <span className="font-mono text-[11px] text-muted">GL-DEMO-2048</span>
        </div>

        {/* stylized sample label with a translucent detection frame */}
        <div className="relative mt-4 overflow-hidden rounded-2xl border border-line bg-cloud p-5">
          <div className="pointer-events-none absolute inset-4 rounded-xl border-2 border-dashed border-blue-accent/60" />
          <div className="relative flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Sample product label
            </span>
            <span className="text-lg font-bold text-ink">Aurora Desk Lamp</span>
            <span className="text-sm text-ink-soft">Model GL-DEMO-2048 · 12 V</span>
            <span className="text-sm text-ink-soft">Warranty: 24 months</span>
          </div>
        </div>

        {/* extracted-field card */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { k: "Model number", v: "GL-DEMO-2048" },
            { k: "Warranty", v: "24 months" },
          ].map((f) => (
            <div key={f.k} className="surface rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted">{f.k}</p>
              <p className="mt-0.5 text-sm font-semibold text-ink">{f.v}</p>
            </div>
          ))}
        </div>

        {/* action-preparation preview + human review indicator */}
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-blue-light/70 p-3">
          <div className="flex items-center gap-2 text-sm text-navy">
            <CheckCircle2 className="h-4 w-4" />
            Draft: warranty registration (fictional)
          </div>
          <StatusPill tone="neutral" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
            Awaiting your approval
          </StatusPill>
        </div>
      </GlassPanel>
    </div>
  );
}
