import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/format";
import { fadeUp } from "../../lib/motion";

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-sm text-muted" role="status">
      <Loader2 className="h-5 w-5 animate-spin text-gold" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading page">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-gold/20" />
          <Loader2 className="h-6 w-6 animate-spin text-gold" aria-hidden="true" />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Preparing workspace</p>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
    >
      <div>
        {eyebrow && (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl text-cream md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-14 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
        <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-cream">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]", className)}>
      <div
        className="h-full rounded-full bg-gold-sheen transition-[width] duration-700 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
