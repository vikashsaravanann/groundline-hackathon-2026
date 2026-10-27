"use client";

import { Sparkles, X } from "lucide-react";

import { Button } from "@/components/design/Button";
import { LogoMark } from "@/components/brand/Logo";
import { MAX_OBJECTIVE_CHARS } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { Studio } from "@/hooks/useStudio";

export function IntentComposer({ studio }: { studio: Studio }) {
  const { objective, setObjective, status } = studio;
  const remaining = MAX_OBJECTIVE_CHARS - objective.length;
  const analyzing = status === "analyzing";
  const over = remaining < 0;

  return (
    <section
      aria-label="Describe your goal"
      className="glass-panel flex flex-col gap-3 rounded-[28px] p-5 sm:p-6"
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <label htmlFor="objective" className="text-base font-semibold text-ink">
          Describe your goal in your own words
        </label>
        <p className="text-xs text-muted">
          Tell Groundline what information to analyze in the image. Nothing is
          sent until you press Analyze.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <LogoMark className="h-9 w-9" />
        <div className="relative min-w-0 flex-1">
          <textarea
            id="objective"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            maxLength={MAX_OBJECTIVE_CHARS + 50}
            rows={3}
            disabled={analyzing}
            placeholder="Enter the information you want analyzed…"
            className="w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus-visible:border-blue-accent focus-visible:outline-none disabled:opacity-60"
          />
          {objective && !analyzing && (
            <button
              type="button"
              aria-label="Clear objective"
              onClick={() => setObjective("")}
              className="absolute right-2 top-2 rounded-full p-1.5 text-muted hover:bg-cloud hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex w-full justify-end">
        <span className={cn("shrink-0 self-end text-xs sm:self-auto", over ? "text-danger" : "text-muted")}>{remaining}</span>
      </div>

      <div className="flex items-center gap-2">
        {analyzing ? (
          <Button variant="danger" onClick={studio.cancel} className="flex-1">
            Cancel analysis
          </Button>
        ) : (
          <Button
            onClick={studio.analyze}
            disabled={!studio.canAnalyze}
            className="flex-1"
            title={studio.canAnalyze ? undefined : "Add an image and an objective first"}
          >
            <Sparkles className="h-4 w-4" />
            Analyze
          </Button>
        )}
      </div>

      {!studio.image && (
        <p className="text-center text-xs text-muted">
          Capture or upload an image to enable analysis.
        </p>
      )}
    </section>
  );
}
