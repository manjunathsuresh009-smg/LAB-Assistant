import type { ReactNode } from "react";
import { CalendarClock, GraduationCap, MapPin, TimerReset } from "lucide-react";
import { formatDate, formatDateTime, formatTime, relativeDays } from "../lib/format";
import type { Booking } from "../lib/types";
import { BookingQr } from "./BookingQr";
import { EquipmentVisual } from "./EquipmentVisual";
import { StatusBadge } from "./ui/Badge";
import { Card } from "./ui/Card";

interface BookingCardProps {
  booking: Booking;
  actions?: ReactNode;
  showStudent?: boolean;
}

export function BookingCard({ booking, actions, showStudent }: BookingCardProps) {
  const equipment = booking.equipment;
  const deadlineSoon = new Date(booking.projectDeadline).getTime() - Date.now() < 3 * 86_400_000;

  return (
    <Card className="p-4 transition-colors duration-200 hover:border-white/[0.12]">
      <div className="flex gap-4">
        {equipment && (
          <div className="hidden sm:block">
            <EquipmentVisual category={equipment.category} name={equipment.name} compact />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-cream">{booking.projectName}</p>
              <p className="mt-0.5 truncate text-xs text-muted">
                {equipment?.name ?? "Equipment"} · {equipment?.department.code ?? booking.department?.code}
              </p>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          {showStudent && booking.user && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted">
              <GraduationCap className="h-3.5 w-3.5 text-gold/70" />
              {booking.user.name}
              {booking.user.email ? <span className="text-muted/60">· {booking.user.email}</span> : null}
            </p>
          )}

          <div className="mt-3 grid gap-1.5 text-[11px] text-muted sm:grid-cols-2">
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 text-electric/70" />
              {formatDate(booking.startsAt)} · {formatTime(booking.startsAt)} – {formatTime(booking.endsAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <TimerReset className="h-3.5 w-3.5 text-gold/70" />
              Due {formatDate(booking.projectDeadline)}
              <span className={deadlineSoon ? "font-semibold text-warn" : ""}>
                ({relativeDays(booking.projectDeadline)})
              </span>
            </span>
            {equipment && (
              <span className="inline-flex items-center gap-1.5 sm:col-span-2">
                <MapPin className="h-3.5 w-3.5" />
                {equipment.location}
              </span>
            )}
          </div>

          {booking.priorityScore !== null && booking.priorityScore !== undefined && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-gold/20 bg-gold/[0.06] px-2 py-1 text-[10px] font-semibold text-gold">
              Priority score {booking.priorityScore}/100
            </p>
          )}

          {booking.status === "APPROVED" && <BookingQr booking={booking} />}

          {booking.status === "REJECTED" && booking.rejectionReason && (
            <p className="mt-2 rounded-lg border border-danger/20 bg-danger/[0.06] px-2.5 py-2 text-[11px] text-danger/90">
              <span className="font-semibold">Rejection reason:</span> {booking.rejectionReason}
            </p>
          )}

          <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted/80">
            {booking.projectDescription}
          </p>

          {booking.reviewedBy && booking.reviewedAt && (
            <p className="mt-2 text-[10px] text-muted/70">
              Reviewed by {booking.reviewedBy.name} · {formatDateTime(booking.reviewedAt)}
            </p>
          )}

          {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </Card>
  );
}
