import type { Metadata } from "next";

import { AppHeader } from "@/components/layout/AppHeader";
import { StudioWorkspace } from "@/components/studio/StudioWorkspace";

export const metadata: Metadata = {
  title: "Groundline Studio",
  description:
    "Capture or upload a product image, describe your goal, and review structured AI assistance — with every step under your control.",
};

export default function StudioPage() {
  return (
    <>
      <AppHeader />
      <main>
        <StudioWorkspace />
      </main>
    </>
  );
}
