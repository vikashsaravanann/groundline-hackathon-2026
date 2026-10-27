import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ArrowUpRight, BookOpen, FileText, Github, Home, LockKeyhole, Route, ShieldCheck, Sparkles } from "lucide-react";

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
            <div className="mt-5 flex w-full flex-1 flex-col gap-3 text-left">
              <div className="flex flex-1 flex-col justify-center rounded-2xl border border-line/60 bg-white/75 p-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-navy">Start with your view</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">Choose a camera capture or an image you already have. Groundline waits for your permission and submission.</p>
              </div>
              <div className="flex flex-1 flex-col justify-center rounded-2xl border border-line/60 bg-white/75 p-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-navy">Give it a clear goal</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">A plain-language objective focuses the analysis on the information you need, such as a model number or warranty field.</p>
              </div>
              <div className="flex flex-1 flex-col justify-center rounded-2xl border border-line/60 bg-white/75 p-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-navy">Useful details to organize</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">Ask about visible identifiers, model numbers, ratings, or warranty details. The image and your request determine what can be found.</p>
              </div>
              <div className="flex flex-1 flex-col justify-center rounded-2xl border border-line/60 bg-white/75 p-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-navy">Keep the result reviewable</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">Check the source label, then correct or confirm visible facts before using them elsewhere. Groundline does not submit external forms or perform transactions.</p>
              </div>
            </div>
          </section>

          <nav aria-label="Explore Groundline" className="flex h-full flex-col items-center gap-3 rounded-3xl border border-line/70 bg-gradient-to-br from-blue-light/45 via-white/80 to-pink-light/30 p-6 text-center text-sm">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-ink">Explore</h2>
            <p className="mb-1 text-sm leading-relaxed text-ink-soft">Find your way around Groundline.</p>
            <div className="flex w-full flex-col gap-2.5">
              <FooterTile href="/" label="Home" icon={Home} />
              <FooterTile href="/how-it-works" label="How it works" icon={Route} />
              <FooterTile href="/studio" label="Open Studio" icon={Sparkles} />
            </div>
            <div className="mt-5 flex w-full flex-1 flex-col gap-3 text-left">
              <div className="flex flex-1 flex-col justify-center rounded-2xl border border-line/60 bg-white/75 p-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-navy">A useful way to explore</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">Read How It Works for the full five-stage concept, then open Studio to try the available capture, upload, objective, and review flow.</p>
                <p className="mt-3 border-t border-line/60 pt-3 text-xs leading-relaxed text-muted">The homepage sample is static and does not use model credits. Analysis begins only after you submit from Studio.</p>
              </div>
              <div className="flex flex-1 flex-col justify-center rounded-2xl bg-purple-light/35 p-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-navy">What to look for</h3>
                <ul className="mt-2 space-y-2 text-sm leading-relaxed text-ink-soft">
                  <li>Does the typed goal make the requested information clear?</li>
                  <li>Can you tell whether a result is MOCK or LIVE?</li>
                  <li>Can you check and correct a field before relying on it?</li>
                </ul>
              </div>
            </div>
          </nav>

          <nav aria-label="Project information" className="flex h-full flex-col items-center gap-3 rounded-3xl border border-line/70 bg-gradient-to-br from-blue-light/45 via-white/80 to-pink-light/30 p-6 text-center text-sm">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-ink">Project</h2>
            <p className="mb-1 text-sm leading-relaxed text-ink-soft">Learn about the project and its scope.</p>
            <div className="flex w-full flex-col gap-2.5">
              <FooterTile href="/features" label="Features" icon={Sparkles} />
              <FooterTile href="/about" label="About the creator" icon={BookOpen} />
              <FooterTile href={REPO} label="GitHub repository" icon={Github} external />
              <FooterTile href="/legal/privacy-policy" label="Privacy Policy" icon={LockKeyhole} />
              <FooterTile href="/legal/security" label="Security" icon={ShieldCheck} />
              <FooterTile href="/legal/terms-and-conditions" label="Terms and Conditions" icon={FileText} />
              <FooterTile href="/legal/cookies" label="Cookies" icon={FileText} />
            </div>
            <div className="mt-auto w-full rounded-2xl border border-line/60 bg-white/75 p-4 text-left">
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-navy">Project scope</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">Groundline is an independent hackathon project exploring a human-guided path from physical product information to reviewable digital assistance.</p>
              <p className="mt-3 border-t border-line/60 pt-3 text-xs leading-relaxed text-muted">Capture, upload, typed objectives, and field review are available. Visual grounding and action preparation remain planned.</p>
            </div>
          </nav>

          <section aria-labelledby="reviewer-info" className="flex h-full flex-col rounded-3xl border border-line/70 bg-gradient-to-br from-blue-light/45 via-white/80 to-pink-light/30 p-6">
            <h2 id="reviewer-info" className="text-xs font-bold uppercase tracking-[0.16em] text-ink">
              For judges and collaborators
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Groundline turns a user-selected product image and a plain-language goal into visible information the person can inspect. The person stays in control of capture, submission, and what to do with the result.
            </p>

            <div className="mt-5 rounded-2xl border border-line/70 bg-white/75 p-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-navy">A quick review path</h3>
              <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-ink-soft">
                <li className="flex gap-3"><span className="font-mono text-purple-accent">01</span><span>Open Studio and capture or upload a synthetic product label.</span></li>
                <li className="flex gap-3"><span className="font-mono text-purple-accent">02</span><span>Describe a specific goal, such as reading the model number.</span></li>
                <li className="flex gap-3"><span className="font-mono text-purple-accent">03</span><span>Submit, inspect the source label, then review or correct each field.</span></li>
              </ol>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-blue-light/45 p-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-navy">Available today</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">Explicit camera capture, image upload, typed objectives, labelled analysis output, and field review.</p>
              </div>
              <div className="rounded-2xl bg-purple-light/45 p-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-navy">Planned next</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">Visual region grounding, task preparation, and a fuller approval timeline are not implemented yet.</p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-muted">
              The homepage example is synthetic and marked SAMPLE · MOCK. The public API is also forced to MOCK; these labels never represent a live model result.
            </p>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Link href="/studio" className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-accent focus-visible:ring-offset-2">Try the Studio</Link>
              <Link href="/how-it-works" className="rounded-full border border-line bg-white/80 px-4 py-2 text-xs font-semibold text-navy transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-accent focus-visible:ring-offset-2">Read the workflow</Link>
            </div>
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
