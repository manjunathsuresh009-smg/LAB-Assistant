import { motion } from "framer-motion";
import { ArrowUpRight, Layers, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../lib/format";
import { fadeUp } from "../lib/motion";
import type { Equipment } from "../lib/types";
import { EquipmentVisual } from "./EquipmentVisual";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";

function availability(equipment: Equipment): { label: string; tone: "success" | "warn" | "danger" } {
  if (equipment.status !== "AVAILABLE") {
    return { label: equipment.status === "MAINTENANCE" ? "Maintenance" : "Retired", tone: "danger" };
  }
  const units = equipment.availableUnitsNow;
  if (units === undefined) return { label: "Available", tone: "success" };
  if (units > 0) return { label: `${units} of ${equipment.quantity} free`, tone: "success" };
  return { label: "Fully booked", tone: "warn" };
}

export function EquipmentCard({ equipment }: { equipment: Equipment }) {
  const status = availability(equipment);
  const specs = Object.entries(equipment.specs ?? {}).slice(0, 2);

  return (
    <motion.div variants={fadeUp}>
      <Card hover className="group h-full overflow-hidden">
        <Link
          to={`/equipment/${equipment.id}`}
          className="flex h-full flex-col focus-visible:outline-none"
          aria-label={`View ${equipment.name}`}
        >
          <div className="p-3.5 pb-0">
            <EquipmentVisual category={equipment.category} name={equipment.name} />
          </div>
          <div className="flex flex-1 flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-cream transition-colors group-hover:text-goldsoft">
                  {equipment.name}
                </h3>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold/70">
                  {equipment.department.code} · {equipment.category}
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted/60 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold" />
            </div>

            <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">{equipment.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {equipment.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3 w-3" /> Qty {equipment.quantity}
              </span>
            </div>

            {specs.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {specs.map(([key, value]) => (
                  <span
                    key={key}
                    className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] text-muted"
                  >
                    {key}: <span className="text-cream/80">{value}</span>
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto flex items-center justify-between gap-2 pt-4">
              <Badge tone={status.tone}>{status.label}</Badge>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border border-gold/25 bg-gold/[0.06] px-2.5 py-1 text-[11px] font-semibold text-gold transition-colors group-hover:bg-gold/[0.12]"
                )}
              >
                Book a slot
              </span>
            </div>
          </div>
        </Link>
      </Card>
    </motion.div>
  );
}
