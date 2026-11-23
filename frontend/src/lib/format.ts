import type { BookingStatus, Role } from "./types";

export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(new Date(value));
}

export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value));
}

export function formatTime(value: string | Date): string {
  return timeFormatter.format(new Date(value));
}

export function formatWindow(startsAt: string, endsAt: string): string {
  return `${formatDateTime(startsAt)} — ${formatTime(endsAt)}`;
}

export function formatPercent(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

export const STATUS_STYLES: Record<
  BookingStatus,
  { label: string; className: string; dot: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-warn/10 text-warn border-warn/25",
    dot: "bg-warn",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-success/10 text-success border-success/25",
    dot: "bg-success",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-danger/10 text-danger border-danger/25",
    dot: "bg-danger",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-muted/10 text-muted border-muted/25",
    dot: "bg-muted",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-electric/10 text-electric border-electric/25",
    dot: "bg-electric",
  },
};

export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "Student",
  FACULTY: "Faculty",
  ADMIN: "Administrator",
};

export function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toTimeInput(date: Date): string {
  return `${`${date.getHours()}`.padStart(2, "0")}:${`${date.getMinutes()}`.padStart(2, "0")}`;
}

export function combineDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time || "00:00"}:00`);
}

export function defaultBookingDates(): {
  date: string;
  startTime: string;
  endTime: string;
  deadline: string;
} {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);
  return {
    date: toDateInput(tomorrow),
    startTime: "10:00",
    endTime: "13:00",
    deadline: toDateInput(deadline),
  };
}

export function relativeDays(value: string | Date): string {
  const diff = new Date(value).getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}
