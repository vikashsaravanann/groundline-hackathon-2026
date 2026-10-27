import Image from "next/image";
import { cn } from "@/lib/utils";

const SYMBOL = "/brand/groundline-symbol-circle.png";

/** Approved Groundline action mark, exported as a square circular badge. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src={SYMBOL}
      alt=""
      aria-hidden="true"
      width={512}
      height={512}
      unoptimized
      draggable={false}
      className={cn("h-8 w-8 shrink-0 object-contain", className)}
    />
  );
}

/** Horizontal Groundline lockup with the name retained as accessible text. */
export function Wordmark({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap", className)}>
      <LogoMark className={cn("h-9 w-9 sm:h-10 sm:w-10", markClassName)} />
      <span className="font-sans text-[1.0625rem] font-bold leading-none tracking-tight text-ink sm:text-xl">
        Groundline
      </span>
    </span>
  );
}
