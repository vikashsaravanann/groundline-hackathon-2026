import Link from "next/link";
import { Github } from "lucide-react";

import { Wordmark } from "@/components/brand/Logo";

const REPO = "https://github.com/vikashsaravanann/groundline-hackathon-2026";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line/70 bg-white/60 px-4 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center">
        <div className="flex w-full flex-col items-center justify-center gap-6">
          <div className="flex max-w-md flex-col items-center gap-3">
            <Wordmark />
            <p className="text-sm leading-relaxed text-ink-soft">
              From what you see to what gets done — with your approval. A
              human-guided visual AI co-pilot.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-col items-center gap-2 text-sm">
            <Link href="/#how" className="text-ink-soft hover:text-ink">
              How it works
            </Link>
            <Link href="/studio" className="text-ink-soft hover:text-ink">
              Open Studio
            </Link>
            <Link href="/#safety" className="text-ink-soft hover:text-ink">
              Safety
            </Link>
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-ink-soft hover:text-ink"
            >
              <Github className="h-4 w-4" /> GitHub repository
            </a>
          </nav>
        </div>

        <div className="flex w-full flex-col items-center gap-1 border-t border-line/70 pt-6 text-center text-xs leading-relaxed text-muted">
          <p>
            Independent submission to the Meta Global AI Developer Hackathon 2026
            — Indie Developer track. Not affiliated with, endorsed by, or
            sponsored by Meta Platforms or Cerebral Valley.
          </p>
          <p>
            Built by Vikash Saravanan, founder of Logic Intelligence Technologies.
            This is an independent individual entry, not a company submission.
          </p>
          <p>Status: under active construction during the event window · Apache-2.0.</p>
        </div>
      </div>
    </footer>
  );
}
