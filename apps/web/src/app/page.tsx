import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { Workflow } from "@/components/landing/Workflow";
import { Safety } from "@/components/landing/Safety";
import { ProductIntro } from "@/components/landing/ProductIntro";
import { Features } from "@/components/landing/Features";
import { Architecture } from "@/components/landing/Architecture";
import { CreatorPreview } from "@/components/landing/CreatorPreview";
import { FinalCTA } from "@/components/landing/FinalCTA";

export default function Home() {
  return (
    <>
      <AppHeader />
      <main>
        <Hero />
        <ProductIntro />
        <Workflow />
        <Features />
        <Architecture />
        <Safety />
        <CreatorPreview />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
