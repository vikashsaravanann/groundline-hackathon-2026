import { Suspense } from "react";

import CaptureFlow from "@/components/CaptureFlow";
import { CAPTURE_STATES, type CaptureState } from "@/lib/types";
import type { Seed } from "@/hooks/useCaptureMachine";

type SearchParams = PageProps<"/">["searchParams"];

export default function Home({ searchParams }: PageProps<"/">) {
  // Production never reads searchParams, so the route prerenders static. The
  // dev-only state preview reads them, which is dynamic under Cache Components,
  // so it lives behind a Suspense boundary (fallback is the real idle flow).
  if (process.env.NODE_ENV === "production") {
    return <CaptureFlow />;
  }
  return (
    <Suspense fallback={<CaptureFlow />}>
      <DevSeededFlow searchParams={searchParams} />
    </Suspense>
  );
}

async function DevSeededFlow({ searchParams }: { searchParams: SearchParams }) {
  // ?state=<name>&mode=<MOCK|live> renders a single state with sample data so
  // every state can be reviewed without a camera or backend.
  const sp = await searchParams;
  const rawState = typeof sp.state === "string" ? sp.state : undefined;
  const mode = typeof sp.mode === "string" ? sp.mode : undefined;
  const seed: Seed | undefined =
    rawState && CAPTURE_STATES.includes(rawState as CaptureState)
      ? { state: rawState as CaptureState, mode }
      : undefined;
  return <CaptureFlow seed={seed} />;
}
