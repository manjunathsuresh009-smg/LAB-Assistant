import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { Booking } from "../lib/types";
import { formatDateTime } from "../lib/format";

interface BookingQrProps {
  booking: Booking;
}

export function BookingQr({ booking }: BookingQrProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const value = [
      "CampusLab AI approved booking pass",
      `Booking ID: ${booking.id}`,
      `Equipment: ${booking.equipment?.name ?? "Equipment"}`,
      `Location: ${booking.equipment?.location ?? "Campus laboratory"}`,
      `Start: ${formatDateTime(booking.startsAt)}`,
      `End: ${formatDateTime(booking.endsAt)}`,
      "Status: Approved",
    ].join("\n");

    QRCode.toDataURL(value, {
      width: 176,
      margin: 1,
      color: { dark: "#F4F1E9", light: "#0F1522" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [booking]);

  if (failed) {
    return (
      <p className="mt-3 text-[11px] text-muted">
        QR code unavailable. Use booking ID {booking.id}.
      </p>
    );
  }

  if (!src) {
    return <p className="mt-3 text-[11px] text-muted">Generating booking QR code...</p>;
  }

  return (
    <div className="mt-3 flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      <img
        src={src}
        alt={`QR code for approved booking ${booking.id}`}
        className="h-24 w-24 rounded-md bg-white p-1"
      />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-cream">Approved booking pass</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Scan to verify booking ID {booking.id} and the approved time window.
        </p>
        <p className="mt-1 truncate text-[10px] text-muted/70">{booking.equipment?.name}</p>
      </div>
    </div>
  );
}
