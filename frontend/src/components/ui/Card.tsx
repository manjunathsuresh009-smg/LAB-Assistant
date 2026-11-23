import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/format";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  children: ReactNode;
}

export function Card({ className, hover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.07] bg-panel/70 shadow-premium backdrop-blur-sm",
        hover &&
          "transition-all duration-300 ease-out hover:-translate-y-1 hover:border-white/[0.12] hover:shadow-lift",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
