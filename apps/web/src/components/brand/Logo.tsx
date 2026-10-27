import { cn } from "@/lib/utils";

/**
 * The Groundline mark: a camera viewfinder (corner brackets) with a grounded
 * focus point and a short action path leaving it — "see it, ground it, act."
 * Original geometry, drawn in currentColor. Not derived from any other brand.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("h-7 w-7", className)}
    >
      {/* viewfinder corner brackets */}
      <path
        d="M4 10V7a3 3 0 0 1 3-3h3M22 4h3a3 3 0 0 1 3 3v3M28 22v3a3 3 0 0 1-3 3h-3M10 28H7a3 3 0 0 1-3-3v-3"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* grounded focus point */}
      <circle cx="16" cy="16" r="3.4" fill="currentColor" />
      {/* action path leaving the point */}
      <path
        d="M16 16c4.2 0 5.6-4 9.8-4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function Wordmark({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="text-navy">
        <LogoMark className={markClassName} />
      </span>
      <span className="text-[1.15rem] font-bold tracking-tight text-ink">
        Groundline
      </span>
    </span>
  );
}
