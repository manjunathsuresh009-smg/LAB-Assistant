import { Link } from "react-router-dom";
import { FlaskConical } from "lucide-react";
import { cn } from "../lib/format";

export function Logo({
  to = "/",
  compact = false,
  className,
}: {
  to?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="CampusLab AI home"
    >
      <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-br from-gold/25 via-gold/10 to-transparent shadow-goldglow">
        <FlaskConical className="h-4.5 w-4.5 text-goldsoft" strokeWidth={1.7} />
        <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-bold tracking-tight text-cream">
            CampusLab <span className="gold-text">AI</span>
          </span>
          <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-muted">
            Lab Resource Network
          </span>
        </span>
      )}
    </Link>
  );
}
