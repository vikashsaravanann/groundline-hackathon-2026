import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A floating liquid-glass surface. Use sparingly — not every element is glass. */
export function GlassPanel({
  as: Comp = "div",
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Comp className={cn("glass-panel rounded-[28px]", className)}>{children}</Comp>
  );
}

/** A crisp, near-opaque card for content that must stay highly legible. */
export function SurfaceCard({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return <div className={cn("surface rounded-[24px]", className)}>{children}</div>;
}
