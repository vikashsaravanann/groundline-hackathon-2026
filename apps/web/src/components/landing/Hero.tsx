import { ArrowRight, Camera, ShieldCheck, Sparkles } from "lucide-react";

import { ButtonLink } from "@/components/design/Button";
import { Reveal } from "@/components/design/Reveal";
import { StatusPill } from "@/components/design/StatusPill";
import { HeroPreview } from "./HeroPreview";

const TRUST = [
  { icon: Camera, label: "Explicit camera consent" },
  { icon: ShieldCheck, label: "You approve every action" },
  { icon: Sparkles, label: "AI and fixtures clearly labelled" },
];

export function Hero() {
  return (
    <section className="px-4 pt-14 sm:pt-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <Reveal className="flex flex-col items-center gap-6 text-center">
          <StatusPill tone="blue" className="w-fit">
            VISION-TO-ACTION AI CO-PILOT
          </StatusPill>
          <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            See it. Understand it.{" "}
            <span className="bg-gradient-to-r from-blue-accent via-purple-accent to-pink-accent bg-clip-text text-transparent">
              Take the next step.
            </span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-ink-soft">
            Groundline helps you capture or upload an image, identify visible
            information, and turn it into structured, reviewable assistance —
            with you in control throughout.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/studio" size="lg">
              Open Groundline Studio
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/workflow" variant="secondary" size="lg">
              Explore the Workflow
            </ButtonLink>
          </div>
          <ul className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {TRUST.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2 text-sm text-ink-soft">
                <Icon className="h-4 w-4 text-blue-accent" />
                {label}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.12}>
          <HeroPreview />
        </Reveal>
      </div>
    </section>
  );
}
