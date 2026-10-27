import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ArrowUpRight, BookOpen, Github, Home, Route, ShieldCheck, Sparkles } from "lucide-react";

import { Wordmark } from "@/components/brand/Logo";

const REPO = "https://github.com/vikashsaravanann/groundline-hackathon-2026";

function FooterTile({
  href,
  label,
  icon: Icon,
  external = false,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
}) {
  const className = "group flex w-full items-center justify-between gap-3 rounded-2xl border border-line/70 bg-white/75 px-3.5 py-3 text-left text-sm font-medium text-ink-soft shadow-[0_2px_10px_rgba(22,34,59,0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-accent/30 hover:bg-white hover:text-ink hover:shadow-[0_8px_20px_rgba(22,34,59,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-accent focus-visible:ring-offset-2";
  const content = (
    <>
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-light/70 text-navy transition group-hover:bg-blue-light">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span>{label}</span>
      </span>
      {external ? (
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition group-hover:text-ink" aria-hidden="true" />
      ) : (
        <ArrowRight className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden="true" />
      )}
    </>
  );

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line/70 bg-white/60 px-5 py-14 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1800px]">
        <div className="grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-[1.2fr_0.75fr_0.9fr_1.25fr] xl:gap-8">
          <section className="flex h-full flex-col items-center rounded-3xl border border-line/70 bg-gradient-to-br from-blue-light/45 via-white/80 to-pink-light/30 p-6 text-center">
            <Wordmark />
            <h2 className="mt-5 text-lg font-bold text-ink">A clearer path from image to useful information</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
              Groundline helps people capture or upload a product label, describe what they want to know, and review the visible details before using them.
            </p>
            <ul className="mt-5 flex flex-col items-center gap-2 text-sm text-ink-soft">
              <li>Choose the image and the goal.</li>
              <li>Inspect labelled analysis results.</li>
              <li>Correct or confirm the extracted fields.</li>
            </ul>
          </section>

          <nav aria-label="Explore Groundline" className="flex h-full flex-col items-center gap-3 rounded-3xl border border-line/70 bg-gradient-to-br from-blue-light/45 via-white/80 to-pink-light/30 p-6 text-center text-sm">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-ink">Explore</h2>
            <p className="mb-1 text-sm leading-relaxed text-ink-soft">Find your way around Groundline.</p>
            <div className="flex w-full flex-col gap-2.5">
              <FooterTile href="/" label="Home" icon={Home} />
              <FooterTile href="/workflow" label="How it works" icon={Route} />
              <FooterTile href="/studio" label="Open Studio" icon={Sparkles} />
            </div>
          </nav>

          <nav aria-label="Project information" className="flex h-full flex-col items-center gap-3 rounded-3xl border border-line/70 bg-gradient-to-br from-blue-light/45 via-white/80 to-pink-light/30 p-6 text-center text-sm">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-ink">Project</h2>
            <p className="mb-1 text-sm leading-relaxed text-ink-soft">Learn about the project and its scope.</p>
            <div className="flex w-full flex-col gap-2.5">
              <FooterTile href="/#features" label="Features" icon={Sparkles} />
              <FooterTile href="/about" label="About the creator" icon={BookOpen} />
              <FooterTile href="/#safety" label="Safety" icon={ShieldCheck} />
              <FooterTile href={REPO} label="GitHub repository" icon={Github} external />
            </div>
          </nav>

          <section aria-labelledby="reviewer-info" className="rounded-3xl border border-line/70 bg-gradient-to-br from-blue-light/45 via-white/80 to-pink-light/30 p-6">
            <h2 id="reviewer-info" className="text-xs font-bold uppercase tracking-[0.16em] text-ink">
              For judges and collaborators
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Review the current scope: camera or image upload, a typed goal, labelled image-analysis output, and human review. The Ground, Prepare, and approval-timeline stages are marked planned.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              The homepage sample is synthetic and marked SAMPLE · MOCK; it does not call a model or represent a live result.
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-line/70 pt-6 text-center text-xs leading-relaxed text-muted">
          <p className="mx-auto max-w-5xl">Independent Indie Developer submission to the Meta Global AI Developer Hackathon 2026.</p>
          <p className="mx-auto max-w-5xl">Created by Vikash Saravanan, founder of Logic Intelligence Technologies; this is an individual hackathon entry, not a company submission.</p>
          <p className="mx-auto max-w-5xl">Not affiliated with, endorsed by, or sponsored by Meta Platforms or Cerebral Valley. Licensed under Apache-2.0 · 2026.</p>
        </div>
      </div>
    </footer>
  );
}
