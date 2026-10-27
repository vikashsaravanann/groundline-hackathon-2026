import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DetailPage, DetailSection } from "@/components/content/DetailPage";
import { features } from "@/content/features";

export function generateStaticParams() { return features.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const feature = features.find((item) => item.slug === slug);
  return feature ? { title: feature.title, description: feature.summary } : { title: "Feature not found" };
}

export default async function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const feature = features.find((item) => item.slug === slug);
  if (!feature) notFound();
  const tone = feature.status === "Available" ? "success" : feature.status === "Planned" ? "purple" : "mock";
  return <DetailPage eyebrow="Feature details" title={feature.title} summary={feature.summary} status={{ label: feature.status, tone }}>
    <DetailSection title="What this feature does"><p>{feature.whatItDoes}</p></DetailSection>
    <DetailSection title="How it works"><ol className="list-decimal space-y-2 pl-5">{feature.howItWorks.map((step) => <li key={step}>{step}</li>)}</ol></DetailSection>
    <DetailSection title="Current scope and limitations"><ul className="list-disc space-y-2 pl-5">{feature.limits.map((limit) => <li key={limit}>{limit}</li>)}</ul></DetailSection>
  </DetailPage>;
}
