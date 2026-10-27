import { ArrowRight, Eye, ScanText, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/design/Reveal";

export function ProductIntro() {
  return (
    <section className="px-4 pt-24 sm:pt-32">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <Reveal className="flex flex-col gap-4 text-center lg:items-start lg:text-left">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-accent">
            What is Groundline?
          </span>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            A clearer path from a physical label to useful information.
          </h2>
          <p className="text-base leading-relaxed text-ink-soft">
            Groundline is a human-guided visual AI assistant. It reads visible
            details from a user-provided still and organizes them around the
            user&apos;s own goal, reducing repetitive retyping while keeping
            every result reviewable.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Today, capture/upload, typed objectives, image understanding, and
            field review form the working flow. Visual grounding and preparing
            digital actions remain planned.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Eye, title: "Look", body: "Use one still image that you choose." },
              { icon: ScanText, title: "Understand", body: "Extract visible fields for your stated goal." },
              { icon: ShieldCheck, title: "Review", body: "Check and correct details before moving on." },
            ].map(({ icon: Icon, title, body }, index) => (
              <article key={title} className="surface flex min-h-52 flex-col items-center justify-center gap-4 rounded-[24px] p-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-light text-navy">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-accent">0{index + 1}</p>
                  <h3 className="mt-1 font-bold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              </article>
            ))}
          </div>
        </Reveal>
      </div>
      <div className="mx-auto mt-8 max-w-6xl text-center">
        <Link href="/workflow" className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-purple-accent">
          See the complete workflow <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
