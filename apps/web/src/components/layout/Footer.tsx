import Link from "next/link";
import { Github } from "lucide-react";

import { Wordmark } from "@/components/brand/Logo";

const REPO = "https://github.com/vikashsaravanann/groundline-hackathon-2026";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line/70 bg-white/60 px-5 py-14 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1800px]">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-[1.2fr_0.75fr_0.9fr_1.25fr] xl:gap-14">
          <div className="flex flex-col items-start gap-4">
            <Wordmark />
            <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
              From what you see to what gets done — with your approval. A human-guided
              visual AI co-pilot for turning chosen images into information you can review.
            </p>
          </div>

          <nav aria-label="Explore Groundline" className="flex flex-col items-start gap-3 text-sm">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-ink">Explore</h2>
            <Link href="/" className="text-ink-soft transition hover:text-ink">Home</Link>
            <Link href="/workflow" className="text-ink-soft transition hover:text-ink">How it works</Link>
            <Link href="/studio" className="text-ink-soft transition hover:text-ink">Open Studio</Link>
          </nav>

          <nav aria-label="Project information" className="flex flex-col items-start gap-3 text-sm">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-ink">Project</h2>
            <Link href="/#features" className="text-ink-soft transition hover:text-ink">Features</Link>
            <Link href="/about" className="text-ink-soft transition hover:text-ink">About the creator</Link>
            <Link href="/#safety" className="text-ink-soft transition hover:text-ink">Safety</Link>
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-ink-soft transition hover:text-ink"
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

        <div className="mt-12 flex flex-col gap-3 border-t border-line/70 pt-6 text-xs leading-relaxed text-muted sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-4xl">
            Independent submission to the Meta Global AI Developer Hackathon 2026 — Indie Developer track. Built by Vikash Saravanan, founder of Logic Intelligence Technologies; this is an individual entry, not a company submission. It is not affiliated with, endorsed by, or sponsored by Meta Platforms or Cerebral Valley.
          </p>
          <p className="shrink-0 sm:text-right">Apache-2.0 · 2026</p>
        </div>
      </div>
    </footer>
  );
}
