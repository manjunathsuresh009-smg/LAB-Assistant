import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "goldOutline";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gold-sheen text-ink font-semibold shadow-goldglow hover:brightness-110 active:brightness-95",
  secondary:
    "border border-white/12 bg-white/[0.04] text-cream font-medium hover:border-white/20 hover:bg-white/[0.08]",
  ghost: "text-muted font-medium hover:bg-white/[0.05] hover:text-cream",
  danger:
    "border border-danger/30 bg-danger/10 text-danger font-medium hover:bg-danger/20",
  goldOutline:
    "border border-gold/40 bg-gold/[0.06] text-gold font-medium hover:bg-gold/[0.12]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-sm rounded-xl gap-2.5",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.985]",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});
