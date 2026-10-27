import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { Workflow } from "@/components/landing/Workflow";
import { Safety } from "@/components/landing/Safety";

export default function Home() {
  return (
    <>
      <AppHeader />
      <main>
        <Hero />
        <Workflow />
        <Safety />
      </main>
      <Footer />
    </>
  );
}
