import type { Metadata } from "next";
import { DetailPage, DetailSection } from "@/components/content/DetailPage";

export type LegalSection = { title: string; paragraphs: string[]; bullets?: string[] };

export function LegalPage({ title, description, updated, sections }: { title: string; description: string; updated: string; sections: LegalSection[] }) {
  return <DetailPage eyebrow="Groundline · Project information" title={title} summary={description} backHref="/" backLabel="Back to Groundline" ctaHref="/studio" ctaLabel="Open Groundline Studio">
    <p className="text-center text-xs text-muted">Last reviewed {updated}</p>
    {sections.map((section) => <DetailSection key={section.title} title={section.title}><>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets && <ul className="list-disc space-y-2 pl-5">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}</></DetailSection>)}
    <p className="rounded-2xl bg-blue-light/50 p-4 text-sm leading-relaxed text-ink-soft">These pages describe the current Groundline project as implemented. They are project information, not legal advice. If the product’s data practices or features change, these pages should be reviewed and updated.</p>
  </DetailPage>;
}

export function legalMetadata(title: string, description: string): Metadata { return { title, description, robots: { index: true, follow: true } }; }
