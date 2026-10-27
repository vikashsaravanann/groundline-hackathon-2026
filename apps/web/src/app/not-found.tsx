import { ButtonLink } from "@/components/design/Button";
import { Wordmark } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Wordmark />
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold text-ink">Page not found</h1>
        <p className="max-w-sm text-sm text-ink-soft">
          That page doesn&apos;t exist. Head back to Groundline and pick up where
          you left off.
        </p>
      </div>
      <div className="flex gap-3">
        <ButtonLink href="/">Back home</ButtonLink>
        <ButtonLink href="/studio" variant="secondary">
          Open Studio
        </ButtonLink>
      </div>
    </main>
  );
}
