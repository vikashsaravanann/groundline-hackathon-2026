import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { ButtonLink } from "@/components/design/Button";
import { StatusPill } from "@/components/design/StatusPill";

export function DetailPage({ eyebrow, title, summary, status, children, backHref = "/", backLabel = "Back to Groundline", ctaHref = "/studio", ctaLabel = "Open Groundline Studio", secondaryHref = "/features", secondaryLabel = "Browse all features" }: {
  eyebrow: string; title: string; summary: string; status?: { label: string; tone: "success" | "mock" | "purple" | "blue" };
  children: ReactNode; backHref?: string; backLabel?: string; ctaHref?: string; ctaLabel?: string; secondaryHref?: string; secondaryLabel?: string;
}) {
  return <><AppHeader /><main className="px-4 pb-24 pt-12 sm:pt-16"><div className="mx-auto max-w-5xl">
    <Link href={backHref} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{backLabel}</Link>
    <header className="glass-panel rounded-[32px] p-7 text-center sm:p-10"><p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-accent">{eyebrow}</p><h1 className="mt-3 text-balance text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{title}</h1><p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-ink-soft sm:text-lg">{summary}</p>{status && <div className="mt-5 flex justify-center"><StatusPill tone={status.tone}>{status.label}</StatusPill></div>}</header>
    <div className="mt-8 space-y-5">{children}</div>
    <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"><ButtonLink href={ctaHref} size="lg">{ctaLabel}<ArrowRight className="h-4 w-4" aria-hidden="true" /></ButtonLink><ButtonLink href={secondaryHref} variant="secondary" size="lg">{secondaryLabel}</ButtonLink></div>
  </div></main><Footer /></>;
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="surface rounded-[28px] p-6 sm:p-8"><h2 className="text-xl font-bold text-ink sm:text-2xl">{title}</h2><div className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft sm:text-base">{children}</div></section>;
}
