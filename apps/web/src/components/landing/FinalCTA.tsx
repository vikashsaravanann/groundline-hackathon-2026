import { ArrowRight } from "lucide-react";

import { ButtonLink } from "@/components/design/Button";
import { Reveal } from "@/components/design/Reveal";

export function FinalCTA() {
  return (
    <section className="px-4 pt-24 sm:pt-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-light via-purple-light to-pink-light p-px shadow-soft">
            <div className="flex flex-col items-center gap-5 rounded-[31px] bg-white/75 px-6 py-12 text-center backdrop-blur-xl sm:px-12 sm:py-16">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-accent">Your next step</p>
              <h2 className="max-w-3xl text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Ready to turn what you see into something useful?
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-ink-soft">
                Bring a product label, describe what you want to know, and review the details Groundline can identify.
              </p>
              <ButtonLink href="/studio" size="lg">
                Open Groundline Studio <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
