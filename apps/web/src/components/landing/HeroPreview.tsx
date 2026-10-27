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
        <div className="flex flex-wrap items-center justify-center gap-3 text-center">
          <StatusPill tone="mock" icon={<ScanLine className="h-3.5 w-3.5" />}>
            SAMPLE · MOCK preview
          </StatusPill>
          <span className="font-mono text-[11px] text-muted">GL-DEMO-2048</span>
        </div>

        {/* Empty illustrative label surface; content is intentionally omitted. */}
        <div className="relative mt-4 min-h-[136px] overflow-hidden rounded-2xl border border-line bg-cloud p-5">
          <div className="pointer-events-none absolute inset-4 rounded-xl border-2 border-dashed border-blue-accent/60" />
        </div>

        {/* extracted-field card */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { k: "Model number", v: "GL-DEMO-2048" },
            { k: "Warranty", v: "24 months" },
          ].map((f) => (
            <div key={f.k} className="surface rounded-xl p-3 text-center">
              <p className="text-[11px] uppercase tracking-wide text-muted">{f.k}</p>
              <p className="mt-0.5 text-sm font-semibold text-ink">{f.v}</p>
            </div>
          ))}
        </div>

        {/* action-preparation preview + human review indicator */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 rounded-xl bg-blue-light/70 p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-navy">
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
