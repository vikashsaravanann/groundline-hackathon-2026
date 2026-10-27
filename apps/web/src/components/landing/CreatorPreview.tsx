import Link from "next/link";
import { ArrowRight, Code2 } from "lucide-react";

import { GlassPanel } from "@/components/design/GlassPanel";
import { Reveal } from "@/components/design/Reveal";
import { creatorProfile } from "@/content/creator";

export function CreatorPreview() {
  return (
    <section className="px-4 pt-24 sm:pt-32">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <GlassPanel className="grid gap-8 p-7 text-center sm:p-10 md:grid-cols-[auto_1fr] md:items-center md:text-left">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] bg-gradient-to-br from-blue-light via-purple-light to-pink-light text-navy md:mx-0">
              <Code2 className="h-10 w-10" aria-hidden="true" />
            </div>
            <div className="flex flex-col items-center gap-3 md:items-start">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-accent">About the creator</span>
              <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{creatorProfile.name}</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">{creatorProfile.introduction}</p>
              <p className="text-xs text-muted">Independent hackathon entry · {creatorProfile.organization}</p>
              <Link href="/about" className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-purple-accent">
                Meet the creator <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </GlassPanel>
        </Reveal>
      </div>
    </section>
  );
}
