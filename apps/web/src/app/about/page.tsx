import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Code2, Github, Layers3, Lightbulb, ShieldCheck } from "lucide-react";

import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { ButtonLink } from "@/components/design/Button";
import { Reveal } from "@/components/design/Reveal";
import { creatorProfile as profile } from "@/content/creator";

export const metadata: Metadata = {
  title: "About the Creator",
  description: "Meet Vikash Saravanan, creator of Groundline, an independent hackathon project.",
};

export default function AboutPage() {
  return (
    <>
      <AppHeader />
      <main className="px-4 pb-24 pt-12 sm:pt-16">
        <div className="mx-auto max-w-5xl">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Groundline
          </Link>
          <Reveal>
            <section className="glass-panel grid gap-8 rounded-[32px] p-7 text-center sm:p-10 md:grid-cols-[220px_1fr] md:items-center md:text-left">
              <div className="mx-auto flex aspect-square w-full max-w-[200px] items-center justify-center rounded-[42px] bg-gradient-to-br from-blue-light via-purple-light to-pink-light text-navy md:mx-0">
                {profile.portrait ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.portrait} alt={profile.name} className="h-full w-full rounded-[42px] object-cover" />
                ) : (
                  <Code2 className="h-16 w-16" aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-col items-center gap-4 md:items-start">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-accent">Creator · Independent project</span>
                <h1 className="text-balance text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{profile.name}</h1>
                <p className="text-lg font-semibold text-navy">{profile.title}</p>
                <p className="max-w-2xl text-base leading-relaxed text-ink-soft">{profile.introduction}</p>
                <p className="text-sm text-muted">{profile.submission} for the {profile.event}. {profile.organizationRelationship} of {profile.organization}; this entry is not a company submission.</p>
                <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                  <a href={profile.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-cloud">
                    <Github className="h-4 w-4" aria-hidden="true" /> Project on GitHub
                  </a>
                  {profile.portfolio && <a href={profile.portfolio} target="_blank" rel="noreferrer" className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-cloud">Portfolio</a>}
                  {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-cloud">LinkedIn</a>}
                </div>
              </div>
            </section>
          </Reveal>

          <section className="mt-16 grid gap-5 md:grid-cols-2">
            <Reveal>
              <article className="surface flex h-full flex-col items-center gap-4 rounded-[28px] p-7 text-center">
                <Lightbulb className="h-7 w-7 text-gold-accent" aria-hidden="true" />
                <h2 className="text-xl font-bold text-ink">Why Groundline was created</h2>
                <p className="text-sm leading-relaxed text-ink-soft">{profile.projectMotivation}</p>
              </article>
            </Reveal>
            <Reveal delay={0.06}>
              <article className="surface flex h-full flex-col items-center gap-4 rounded-[28px] p-7 text-center">
                <Layers3 className="h-7 w-7 text-purple-accent" aria-hidden="true" />
                <h2 className="text-xl font-bold text-ink">Project vision</h2>
                <p className="text-sm leading-relaxed text-ink-soft">
                  Groundline explores a human-guided bridge between physical product information and digital tasks: capture a still, state a goal, review visible facts, and keep any future action under human control. Grounding and action preparation are planned capabilities, not current features.
                </p>
              </article>
            </Reveal>
          </section>

          <Reveal className="mt-5">
            <section className="glass-panel rounded-[28px] p-7 sm:p-9">
              <div className="flex flex-col items-center gap-3 text-center">
                <ShieldCheck className="h-7 w-7 text-blue-accent" aria-hidden="true" />
                <h2 className="text-xl font-bold text-ink">Technical and product focus</h2>
                <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
                  The following points describe work present in this repository, rather than a complete biography or résumé.
                </p>
              </div>
              <ul className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-2">
                {profile.technicalFocus.map((item) => (
                  <li key={item} className="rounded-2xl bg-white/80 p-4 text-sm leading-relaxed text-ink-soft">{item}</li>
                ))}
              </ul>
            </section>
          </Reveal>

          {profile.biography && <section className="mt-5 rounded-3xl bg-white/60 p-7"><h2 className="text-xl font-bold text-ink">Biography</h2><p className="mt-3 text-sm leading-relaxed text-ink-soft">{profile.biography}</p></section>}
          {profile.education && <section className="mt-5 rounded-3xl bg-white/60 p-7"><h2 className="text-xl font-bold text-ink">Education</h2><p className="mt-3 text-sm leading-relaxed text-ink-soft">{profile.education}</p></section>}
          {profile.achievements?.length ? <section className="mt-5 rounded-3xl bg-white/60 p-7"><h2 className="text-xl font-bold text-ink">Selected achievements</h2><ul className="mt-3 list-inside list-disc text-sm text-ink-soft">{profile.achievements.map((achievement) => <li key={achievement}>{achievement}</li>)}</ul></section> : null}

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/studio" size="lg">Open Groundline Studio <ArrowRight className="h-4 w-4" aria-hidden="true" /></ButtonLink>
            <ButtonLink href="/how-it-works" variant="secondary" size="lg">Explore the workflow</ButtonLink>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
