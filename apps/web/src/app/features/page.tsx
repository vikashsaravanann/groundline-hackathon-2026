import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DetailPage } from "@/components/content/DetailPage";
import { features } from "@/content/features";

export const metadata: Metadata = { title: "Features", description: "Explore Groundline's current image capture, analysis, review, and planned capabilities." };

export default function FeaturesPage() {
  return <DetailPage eyebrow="Groundline capabilities" title="Features, explained clearly" summary="Each page describes what a capability does, how it works, and where its current limits are. Available, MOCK, and planned features are labelled honestly." ctaHref="/how-it-works" ctaLabel="How it works" secondaryHref="/studio" secondaryLabel="Open Studio">
    <section className="grid gap-4 sm:grid-cols-2">
      {features.map((feature) => <Link key={feature.slug} href={`/features/${feature.slug}`} className="surface group rounded-[24px] p-6 transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-accent"><span className="text-xs font-semibold uppercase tracking-wide text-purple-accent">{feature.status}</span><h2 className="mt-2 text-lg font-bold text-ink">{feature.title}</h2><p className="mt-2 text-sm leading-relaxed text-ink-soft">{feature.summary}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy">Read feature details <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" /></span></Link>)}
    </section>
  </DetailPage>;
}
