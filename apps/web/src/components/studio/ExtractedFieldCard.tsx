"use client";

import { useState } from "react";
import { Check, Pencil } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AnalysisField } from "@/types/analysis";

export function ExtractedFieldCard({
  field,
  onConfirm,
  onEdit,
}: {
  field: AnalysisField;
  onConfirm: (id: string) => void;
  onEdit: (id: string, value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(field.value ?? "");

  const confidenceLabel =
    field.confidence == null
      ? "Not evaluated"
      : `${Math.round(field.confidence * 100)}% · model-reported`;

  return (
    <div
      className={cn(
        "surface flex flex-col gap-1.5 rounded-2xl p-4",
        field.userConfirmed && "ring-1 ring-success/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          {field.label}
        </span>
        <span className="shrink-0 text-[11px] text-muted">{confidenceLabel}</span>
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label={`Edit ${field.label}`}
            className="w-full rounded-lg border border-line bg-white px-2 py-1 text-sm text-ink focus-visible:border-blue-accent focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              onEdit(field.id, draft.trim());
              setEditing(false);
            }}
            className="rounded-lg bg-navy px-3 py-1 text-xs font-semibold text-white"
          >
            Save
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-ink">
            {field.value ?? <span className="italic text-muted">Not readable</span>}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={`Edit ${field.label}`}
              onClick={() => {
                setDraft(field.value ?? "");
                setEditing(true);
              }}
              className="rounded-lg p-1.5 text-muted hover:bg-cloud hover:text-ink"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-pressed={field.userConfirmed}
              aria-label={field.userConfirmed ? `Unconfirm ${field.label}` : `Confirm ${field.label}`}
              onClick={() => onConfirm(field.id)}
              className={cn(
                "rounded-lg p-1.5 transition",
                field.userConfirmed
                  ? "bg-success text-white"
                  : "text-muted hover:bg-cloud hover:text-ink",
              )}
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {field.evidence && <p className="text-xs text-muted">{field.evidence}</p>}
    </div>
  );
}
