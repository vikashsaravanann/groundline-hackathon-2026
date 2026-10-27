import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, Camera, ClipboardCheck, Crosshair, Eye, FileImage, ShieldCheck, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { ButtonLink } from "@/components/design/Button";
import { Reveal } from "@/components/design/Reveal";
import { SectionHeading } from "@/components/design/SectionHeading";
import { StatusPill } from "@/components/design/StatusPill";

export const metadata: Metadata = {
  title: "How Groundline Works",
  description: "See how Groundline captures a still, understands visible information, and keeps review in human hands.",
};

type WorkflowStage = {
  number: string;
  title: string;
  status: "available" | "mock" | "planned";
  icon: LucideIcon;
  intro: string;
  details: string[];
};

const stages: WorkflowStage[] = [
  {
    number: "01",
    title: "Capture",
    status: "available",
    icon: Camera,
    intro: "You decide when Groundline may use the camera, or choose an image to upload.",
    details: [
      "Camera access starts only after you press Start camera.",
      "Capture one still within the visible viewfinder, then retake or remove it as needed.",
      "PNG, JPEG, and WebP uploads are checked, resized in the browser, and bounded before submission.",
      "The camera stream is not continuously uploaded.",
    ],
  },
  {
    number: "02",
    title: "Understand",
    status: "mock",
    icon: Eye,
    intro: "You describe the information you want, and the API returns visible facts as structured fields.",
    details: [
      "The typed objective tells the analysis what information matters to you.",
      "The FastAPI backend validates image bytes and the request before selecting the image fact-extraction capability.",
      "The public demo currently uses an explicitly labelled MOCK fixture while production access controls are completed.",
      "A prior controlled synthetic-label LIVE result is documented; model output can still be wrong or incomplete.",
    ],
  },
  {
    number: "03",
    title: "Ground",
    status: "planned",
    icon: Crosshair,
    intro: "Groundline is planned to show the image region that supports an extracted field.",
    details: [
      "Visual region grounding and SAM integration are not part of the current working flow.",
      "This stage will be marked available only after its model path and image overlay are implemented and tested.",
    ],
  },
  {
    number: "04",
    title: "Prepare",
    status: "planned",
    icon: ClipboardCheck,
    intro: "A future stage may organize reviewed details into a safe, fictional digital task draft.",
    details: [
      "Groundline does not currently fill external websites or submit forms.",
      "Any future action preparation will be constrained and shown to the user before it proceeds.",
    ],
  },
  {
    number: "05",
    title: "Review",
    status: "planned",
    icon: UserCheck,
    intro: "The intended design keeps people responsible for checking and approving consequential next steps.",
    details: [
      "The current Studio lets you review, edit, and confirm extracted fields.",
      "A complete action-approval timeline is planned and is not represented as implemented today.",
    ],
  },
];

function stageStatus(status: WorkflowStage["status"]) {
  if (status === "available") return <StatusPill tone="success">Available</StatusPill>;
  if (status === "mock") return <StatusPill tone="mock">Available · MOCK demo</StatusPill>;
  return <StatusPill tone="purple">Planned</StatusPill>;
}

export default function WorkflowPage() {
  return (
    <>
      <AppHeader />
      <main className="px-4 pb-24 pt-12 sm:pt-16">
        <div className="mx-auto max-w-5xl">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Groundline
          </Link>
          <Reveal>
            <SectionHeading
              eyebrow="The Groundline workflow"
              title="From a physical label to a result you can review"
              subtitle="Capture and Understand are the current practical flow. The remaining stages describe the product direction and stay marked Planned until verified."
            />
          </Reveal>

          <div className="mt-8 flex flex-wrap justify-center gap-3" aria-label="Workflow status legend">
            <StatusPill tone="success">Available</StatusPill>
            <StatusPill tone="mock">MOCK sample</StatusPill>
            <StatusPill tone="purple">Planned</StatusPill>
          </div>

          <ol className="mt-12 flex flex-col gap-5">
            {stages.map(({ number, title, status, icon: Icon, intro, details }, index) => (
              <li key={number} className="grid gap-3 md:grid-cols-[72px_1fr]">
                <div className="flex flex-col items-center gap-3 pt-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-light text-navy">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {index < stages.length - 1 && <ArrowDown className="h-5 w-5 text-line" aria-hidden="true" />}
                </div>
                <Reveal delay={index * 0.04}>
                  <article className="surface rounded-[28px] p-6 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-purple-accent">{number}</span>
                        <h2 className="text-xl font-bold text-ink sm:text-2xl">{title}</h2>
                      </div>
                      {stageStatus(status)}
                    </div>
                    <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink-soft">{intro}</p>
                    <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                      {details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2 rounded-2xl bg-cloud/80 p-4 text-sm leading-relaxed text-ink-soft">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-accent" aria-hidden="true" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/studio" size="lg">Open Groundline Studio <ArrowRight className="h-4 w-4" aria-hidden="true" /></ButtonLink>
            <ButtonLink href="/" variant="secondary" size="lg"><FileImage className="h-4 w-4" aria-hidden="true" /> Back to Home</ButtonLink>
          </div>
          <p className="mx-auto mt-5 flex max-w-xl items-center justify-center gap-2 text-center text-xs text-muted">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            A fixture is labelled MOCK. It never stands in for a failed LIVE request.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
