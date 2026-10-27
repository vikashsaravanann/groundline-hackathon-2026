import { Camera, FileImage, MessageSquareText, ScanText, PencilLine, BadgeCheck, LockKeyhole, Crosshair } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import { Reveal } from "@/components/design/Reveal";
import { SectionHeading } from "@/components/design/SectionHeading";
import { StatusPill } from "@/components/design/StatusPill";

const FEATURES: { slug: string; icon: LucideIcon; title: string; body: string; state: "available" | "mock" | "planned" }[] = [
  { slug: "camera-capture", icon: Camera, title: "Camera capture", body: "Start the camera only when you choose, frame a label, and capture a still.", state: "available" },
  { slug: "image-upload", icon: FileImage, title: "Image upload", body: "Use a PNG, JPEG, or WebP image with client and server validation.", state: "available" },
  { slug: "typed-objectives", icon: MessageSquareText, title: "Your typed objective", body: "Tell Groundline what you want to find in your own words.", state: "available" },
  { slug: "visible-fact-extraction", icon: ScanText, title: "Visible fact extraction", body: "Organize visible label details into structured fields for review.", state: "mock" },
  { slug: "human-review", icon: PencilLine, title: "Human correction", body: "Edit or confirm extracted fields before using them elsewhere.", state: "available" },
  { slug: "source-labeling", icon: BadgeCheck, title: "Source labeling", body: "Results identify whether they came from a model or a sample fixture.", state: "available" },
  { slug: "credential-safety", icon: LockKeyhole, title: "Backend-only credentials", body: "Provider keys stay on the API server and are never bundled into the browser.", state: "available" },
  { slug: "visual-grounding", icon: Crosshair, title: "Visual region grounding", body: "Show which part of the image informed a field.", state: "planned" },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-28 px-4 pt-24 sm:pt-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading
            eyebrow="What you can do"
            title="Useful image understanding, with the person in charge"
            subtitle="Groundline keeps the working capture, upload, typed-intent, and review flow distinct from capabilities that are still planned."
          />
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ slug, icon: Icon, title, body, state }, index) => (
            <Reveal key={title} delay={(index % 4) * 0.04}>
              <Link href={`/features/${slug}`} className="surface group flex h-full min-h-56 flex-col items-center gap-4 rounded-[24px] p-6 text-center transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-accent focus-visible:ring-offset-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-light text-purple-accent">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="font-bold text-ink">{title}</h3>
                <p className="flex-1 text-sm leading-relaxed text-ink-soft">{body}</p>
                {state === "available" && <StatusPill tone="success">Available</StatusPill>}
                {state === "mock" && <StatusPill tone="mock">Available · MOCK demo</StatusPill>}
                {state === "planned" && <StatusPill tone="purple">Planned</StatusPill>}
                <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-navy">Feature details <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" /></span>
              </Link>
            </Reveal>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <Link href="/features" className="inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-navy transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-accent">
            <BookOpen className="h-4 w-4" aria-hidden="true" /> Explore every feature <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
