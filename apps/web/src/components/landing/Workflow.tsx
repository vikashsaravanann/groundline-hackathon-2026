import { Camera, Eye, Crosshair, ClipboardCheck, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Reveal } from "@/components/design/Reveal";
import { SectionHeading } from "@/components/design/SectionHeading";
import { StatusPill } from "@/components/design/StatusPill";
import { cn } from "@/lib/utils";

type StageStatus = "available" | "mock" | "planned";

interface Stage {
  icon: LucideIcon;
  title: string;
  body: string;
  status: StageStatus;
}

const STAGES: Stage[] = [
  {
    icon: Camera,
    title: "Capture",
    body: "Give explicit permission, then take one still of a product label — or upload an image. Nothing is captured automatically.",
    status: "available",
  },
  {
    icon: Eye,
    title: "Understand",
    body: "The image-understanding flow returns structured visible facts for review. The public demo currently uses a clearly labelled MOCK fixture while live-use safeguards are completed; prior controlled LIVE verification is documented.",
    status: "mock",
  },
  {
    icon: Crosshair,
    title: "Ground",
    body: "The relevant region is highlighted so you can see exactly what informed the result.",
    status: "planned",
  },
  {
    icon: ClipboardCheck,
    title: "Prepare",
    body: "Groundline drafts a constrained, fictional digital action — never a real purchase or submission.",
    status: "planned",
  },
  {
    icon: UserCheck,
    title: "Review",
    body: "You approve, edit, or reject every step. Approved actions are recorded in an audit timeline.",
    status: "planned",
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
            subtitle="Capture and understanding form the current workflow. Grounding, action preparation and an approval timeline remain planned and are clearly marked."
          />
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {STAGES.map((stage, i) => (
            <Reveal
              key={stage.title}
              delay={i * 0.06}
              className={cn(
                "lg:col-span-2",
                i === 3 && "lg:col-start-2",
                i === 4 &&
                  "sm:col-span-2 sm:w-1/2 sm:justify-self-center lg:col-start-4 lg:w-full",
              )}
            >
              <article className="surface flex h-full flex-col items-center gap-3 rounded-[24px] p-6 text-center">
                <div className="flex w-full flex-wrap items-center justify-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-light text-navy">
                    <stage.icon className="h-5 w-5" />
                  </span>
                  {stage.status === "available" && (
                    <StatusPill tone="success">Available</StatusPill>
                  )}
                  {stage.status === "mock" && (
                    <StatusPill tone="blue">Available · MOCK</StatusPill>
                  )}
                  {stage.status === "planned" && (
                    <StatusPill tone="purple">Planned</StatusPill>
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
