import { Camera, Eye, Crosshair, ClipboardCheck, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Reveal } from "@/components/design/Reveal";
import { SectionHeading } from "@/components/design/SectionHeading";
import { StatusPill } from "@/components/design/StatusPill";

interface Stage {
  icon: LucideIcon;
  title: string;
  body: string;
  planned?: boolean;
}

const STAGES: Stage[] = [
  {
    icon: Camera,
    title: "Capture",
    body: "Give explicit permission, then take one still of a product label — or upload an image. Nothing is captured automatically.",
  },
  {
    icon: Eye,
    title: "Understand",
    body: "Meta's vision model reads the visible details and returns structured fields you can review and correct.",
  },
  {
    icon: Crosshair,
    title: "Ground",
    body: "The relevant region is highlighted so you can see exactly what informed the result.",
    planned: true,
  },
  {
    icon: ClipboardCheck,
    title: "Prepare",
    body: "Groundline drafts a constrained, fictional digital action — never a real purchase or submission.",
    planned: true,
  },
  {
    icon: UserCheck,
    title: "Review",
    body: "You approve, edit, or reject every step. Approved actions are recorded in an audit timeline.",
    planned: true,
  },
];

export function Workflow() {
  return (
    <section id="how" className="scroll-mt-24 px-4 pt-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="Five steps from what you see to what gets done"
            subtitle="Capture and understanding work today. Grounding, action-preparation and the approval timeline are planned for later integration and are clearly marked."
          />
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STAGES.map((stage, i) => (
            <Reveal key={stage.title} delay={i * 0.06}>
              <article className="surface flex h-full flex-col gap-3 rounded-[24px] p-6">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-light text-navy">
                    <stage.icon className="h-5 w-5" />
                  </span>
                  {stage.planned ? (
                    <StatusPill tone="purple">Planned</StatusPill>
                  ) : (
                    <StatusPill tone="success">Available</StatusPill>
                  )}
                </div>
                <h3 className="text-lg font-bold text-ink">
                  <span className="mr-1 text-muted">{i + 1}.</span>
                  {stage.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-soft">{stage.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
