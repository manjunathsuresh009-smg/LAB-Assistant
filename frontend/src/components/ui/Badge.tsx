import type { ReactNode } from "react";
import { cn, STATUS_STYLES } from "../../lib/format";
import type { BookingStatus } from "../../lib/types";

type Tone = "gold" | "blue" | "success" | "danger" | "warn" | "neutral";

const TONES: Record<Tone, string> = {
  gold: "border-gold/30 bg-gold/10 text-goldsoft",
  blue: "border-electric/30 bg-electric/10 text-electricsoft",
  success: "border-success/25 bg-success/10 text-success",
  danger: "border-danger/25 bg-danger/10 text-danger",
  warn: "border-warn/25 bg-warn/10 text-warn",
  neutral: "border-white/10 bg-white/[0.04] text-muted",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        style.className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} aria-hidden="true" />
      {style.label}
    </span>
  );
}
