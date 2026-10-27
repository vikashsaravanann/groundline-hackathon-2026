import { ArrowDown, Braces, Cloud, Eye, ServerCog } from "lucide-react";

import { Reveal } from "@/components/design/Reveal";
import { SectionHeading } from "@/components/design/SectionHeading";
import { StatusPill } from "@/components/design/StatusPill";

const LAYERS = [
  { icon: Eye, title: "Your browser", body: "Camera or upload, typed goal, image preview, and a reviewable result." },
  { icon: ServerCog, title: "Groundline API", body: "FastAPI checks image bytes, request limits, tracing, and the selected capability." },
  { icon: Cloud, title: "Model capability", body: "Meta is the image-extraction adapter. Baseten's text adapter is implemented, but its live model entitlement and user-facing route still need verification." },
  { icon: Braces, title: "Structured response", body: "Normalized fields return to Groundline with model provenance and usage metadata." },
];

export function Architecture() {
  return (
    <section className="px-4 pt-24 sm:pt-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading
            eyebrow="Behind the flow"
            title="A small, understandable AI pipeline"
            subtitle="The browser never holds a model key. Requests travel to the Groundline API, which validates the input and keeps the result traceable."
          />
        </Reveal>
        <div className="mt-10 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-stretch">
          {LAYERS.map(({ icon: Icon, title, body }, index) => (
            <div key={title} className="contents">
              <Reveal delay={index * 0.04}>
                <article className="glass-panel flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-[24px] p-5 text-center">
                  <Icon className="h-6 w-6 text-purple-accent" aria-hidden="true" />
                  <h3 className="font-bold text-ink">{title}</h3>
                  <p className="text-sm leading-relaxed text-ink-soft">{body}</p>
                </article>
              </Reveal>
              {index < LAYERS.length - 1 && (
                <div className="flex items-center justify-center text-blue-accent" aria-hidden="true">
                  <ArrowDown className="h-4 w-4 md:hidden" />
                  <span className="hidden md:block">→</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-center">
          <StatusPill tone="mock">Public demo currently uses MOCK while live-use safeguards are finalized</StatusPill>
          <span className="text-xs text-muted">Sample cards on this page never call a model.</span>
        </div>
      </div>
    </section>
  );
}
