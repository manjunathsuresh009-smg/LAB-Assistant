import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/format";
import { fadeUp } from "../../lib/motion";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent?: "gold" | "blue" | "green";
}

const ACCENTS = {
  gold: "border-gold/20 bg-gold/[0.08] text-gold",
  blue: "border-electric/20 bg-electric/[0.08] text-electric",
  green: "border-success/20 bg-success/[0.08] text-success",
};

export function StatCard({ label, value, hint, icon: Icon, accent = "gold" }: StatCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      className="group rounded-2xl border border-white/[0.07] bg-panel/70 p-5 shadow-premium backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.12] hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
          <p className="mt-2.5 text-3xl font-semibold tracking-tight text-cream">{value}</p>
          {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105",
            ACCENTS[accent]
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
        </div>
      </div>
    </motion.div>
  );
}
