"use client";

import { useEffect } from "react";

import { Button } from "@/components/design/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the browser console only; never shown raw to the user.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-ink">Something went wrong</h1>
        <p className="max-w-sm text-sm text-ink-soft">
          An unexpected error occurred. You can try again — your work is not sent
          anywhere automatically.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
