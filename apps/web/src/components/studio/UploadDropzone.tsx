"use client";

import { useRef, useState } from "react";
import { ImageUp } from "lucide-react";

import { cn } from "@/lib/utils";

export function UploadDropzone({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-5 text-center transition",
        dragging ? "border-blue-accent bg-blue-light/60" : "border-line bg-white/50",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />
      <ImageUp className="h-5 w-5 text-blue-accent" aria-hidden />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="text-sm font-semibold text-navy underline-offset-2 hover:underline disabled:opacity-50"
      >
        Upload an image
      </button>
      <p className="text-xs text-muted">PNG, JPEG or WebP · drag &amp; drop or browse</p>
    </div>
  );
}
