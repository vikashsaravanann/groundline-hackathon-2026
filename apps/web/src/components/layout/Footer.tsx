import Link from "next/link";
import { Github } from "lucide-react";

import { Wordmark } from "@/components/brand/Logo";

const REPO = "https://github.com/vikashsaravanann/groundline-hackathon-2026";

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
            <Link href="/" className="w-full rounded-2xl px-4 py-2.5 text-ink-soft transition hover:bg-white/80 hover:text-ink">Home</Link>
            <Link href="/workflow" className="w-full rounded-2xl px-4 py-2.5 text-ink-soft transition hover:bg-white/80 hover:text-ink">How it works</Link>
            <Link href="/studio" className="w-full rounded-2xl px-4 py-2.5 text-ink-soft transition hover:bg-white/80 hover:text-ink">Open Studio</Link>
          </nav>

          <nav aria-label="Project information" className="flex h-full flex-col items-center gap-3 rounded-3xl border border-line/70 bg-gradient-to-br from-blue-light/45 via-white/80 to-pink-light/30 p-6 text-center text-sm">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-ink">Project</h2>
            <p className="mb-1 text-sm leading-relaxed text-ink-soft">Learn about the project and its scope.</p>
            <Link href="/#features" className="w-full rounded-2xl px-4 py-2.5 text-ink-soft transition hover:bg-white/80 hover:text-ink">Features</Link>
            <Link href="/about" className="w-full rounded-2xl px-4 py-2.5 text-ink-soft transition hover:bg-white/80 hover:text-ink">About the creator</Link>
            <Link href="/#safety" className="w-full rounded-2xl px-4 py-2.5 text-ink-soft transition hover:bg-white/80 hover:text-ink">Safety</Link>
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-ink-soft transition hover:bg-white/80 hover:text-ink"
            >
              <Github className="h-4 w-4" /> GitHub repository
            </a>
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
