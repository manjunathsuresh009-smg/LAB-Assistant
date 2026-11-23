import {
  Activity,
  Bot,
  Boxes,
  BrainCircuit,
  CircuitBoard,
  Cpu,
  Grid2x2,
  Printer,
  RadioTower,
  ServerCog,
  Sprout,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/format";

interface Visual {
  Icon: LucideIcon;
  gradient: string;
  tint: string;
}

const VISUALS: Array<{ match: RegExp; visual: Visual }> = [
  { match: /microcontroller|embedded/i, visual: { Icon: Cpu, gradient: "from-gold/25 via-gold/5", tint: "text-gold" } },
  { match: /single board|raspberry/i, visual: { Icon: CircuitBoard, gradient: "from-electric/25 via-electric/5", tint: "text-electric" } },
  { match: /edge ai|ai|machine/i, visual: { Icon: BrainCircuit, gradient: "from-electric/30 via-electric/5", tint: "text-electricsoft" } },
  { match: /fpga|vlsi/i, visual: { Icon: Grid2x2, gradient: "from-gold/20 via-electric/10", tint: "text-goldsoft" } },
  { match: /fabrication|3d/i, visual: { Icon: Printer, gradient: "from-gold/20 via-transparent", tint: "text-gold" } },
  { match: /iot/i, visual: { Icon: RadioTower, gradient: "from-success/20 via-success/5", tint: "text-success" } },
  { match: /robotic/i, visual: { Icon: Bot, gradient: "from-electric/25 via-transparent", tint: "text-electric" } },
  { match: /computing|gpu|workstation/i, visual: { Icon: ServerCog, gradient: "from-gold/25 via-electric/5", tint: "text-goldsoft" } },
  { match: /test|measurement|signal/i, visual: { Icon: Activity, gradient: "from-electric/20 via-transparent", tint: "text-electric" } },
  { match: /sensor|agriculture|soil/i, visual: { Icon: Sprout, gradient: "from-success/25 via-transparent", tint: "text-success" } },
  { match: /embedded/i, visual: { Icon: Workflow, gradient: "from-gold/20 via-transparent", tint: "text-gold" } },
];

const DEFAULT_VISUAL: Visual = {
  Icon: Boxes,
  gradient: "from-white/15 via-white/5",
  tint: "text-cream",
};

export function categoryVisual(category: string): Visual {
  return VISUALS.find((entry) => entry.match.test(category))?.visual ?? DEFAULT_VISUAL;
}

interface EquipmentVisualProps {
  category: string;
  name: string;
  className?: string;
  compact?: boolean;
}

export function EquipmentVisual({ category, name, className, compact }: EquipmentVisualProps) {
  const { Icon, gradient, tint } = categoryVisual(category);
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/[0.06] bg-ink",
        compact ? "h-12 w-12" : "aspect-[16/9] w-full",
        className
      )}
      aria-hidden="true"
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.16) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(circle at 50% 45%, black, transparent 75%)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "relative flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm",
            compact ? "h-9 w-9" : "h-20 w-20",
            "transition-transform duration-500 ease-out group-hover:scale-110"
          )}
        >
          <Icon className={cn(tint, compact ? "h-5 w-5" : "h-9 w-9")} strokeWidth={1.4} />
        </div>
      </div>
      {!compact && (
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-cream/45">
          <span className="truncate">{category}</span>
          <span className="truncate text-right">{name}</span>
        </div>
      )}
    </div>
  );
}
