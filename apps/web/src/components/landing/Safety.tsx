import { Camera, Eye, FlaskConical, Lock, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { GlassPanel } from "@/components/design/GlassPanel";
import { Reveal } from "@/components/design/Reveal";
import { SectionHeading } from "@/components/design/SectionHeading";

const POINTS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Camera,
    title: "Explicit camera consent",
    body: "The camera only turns on when you ask it to, and stops when you leave. Frames are never streamed or uploaded automatically.",
  },
  {
    icon: Eye,
    title: "You stay in control",
    body: "Every extracted field is yours to review, correct, or reject before anything moves forward.",
  },
  {
    icon: ShieldCheck,
    title: "No purchases, no real submissions",
    body: "The demo never buys anything or submits to a real external service. Actions are fictional and require your approval.",
  },
  {
    icon: FlaskConical,
    title: "AI and fixtures are labelled",
    body: "A live model result is marked LIVE; a canned example is clearly marked MOCK. A fixture is never passed off as a real inference.",
  },
  {
    icon: Lock,
    title: "Credentials stay on the backend",
    body: "No API key ever reaches the browser. The frontend holds no secrets of any kind.",
  },
];

export function Safety() {
  return (
    <section id="safety" className="scroll-mt-24 px-4 pt-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <GlassPanel className="overflow-hidden bg-purple-light/50 p-8 sm:p-12">
            <SectionHeading
              eyebrow="Safety first"
              title="Built to keep a human in the loop"
              subtitle="Groundline is designed so you always know what it sees, what it's doing, and what it would do next — before anything happens."
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {POINTS.map((p) => (
                <div key={p.title} className="flex flex-col gap-2 rounded-2xl bg-white/70 p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-secondary text-purple-accent">
                    <p.icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-semibold text-ink">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-soft">{p.body}</p>
                </div>
              ))}
            </div>
          </GlassPanel>
        </Reveal>
      </div>
    </section>
  );
}
