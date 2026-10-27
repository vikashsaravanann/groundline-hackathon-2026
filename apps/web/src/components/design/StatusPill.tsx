import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone =
  | "neutral"
  | "blue"
  | "purple"
  | "pink"
  | "success"
  | "warning"
  | "danger"
  | "mock"
  | "live";

const TONES: Record<Tone, string> = {
  neutral: "bg-cloud text-ink-soft border-line",
  blue: "bg-blue-light text-navy border-transparent",
  purple: "bg-purple-light text-purple-accent border-transparent",
  pink: "bg-pink-light text-pink-accent border-transparent",
  success: "bg-[#e6f4ee] text-success border-transparent",
  warning: "bg-gold-light text-warning border-transparent",
  danger: "bg-[#fbe9ec] text-danger border-transparent",
  // MOCK uses a distinctive violet-blue label so fixtures stay obvious and
  // visually separate from both the gold caution state and green LIVE state.
  mock: "bg-mock text-white border-transparent",
  live: "bg-success text-white border-transparent",
};

export function StatusPill({
  tone = "neutral",
  children,
  icon,
  className,
  role,
}: {
  tone?: Tone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  role?: string;
}) {
  return (
    <span
      role={role}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
