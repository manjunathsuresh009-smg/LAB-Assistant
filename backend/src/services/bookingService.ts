import { BookingStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../utils/errors";
import { parseJson, serializeBooking } from "../utils/serializers";
import { computePriority, PriorityBreakdown } from "./scoring";
import { findAlternativeSlots, Interval, peakConcurrency } from "./scheduling";

export const bookingInclude = {
  equipment: { include: { department: true } },
  department: true,
  user: { select: { id: true, name: true, email: true, role: true, department: true } },
  reviewedBy: { select: { id: true, name: true } },
} satisfies Prisma.BookingInclude;

const MIN_DURATION_MINUTES = 30;
const MAX_DURATION_MINUTES = 8 * 60;
const MAX_DAYS_AHEAD = 90;

export interface CreateBookingInput {
  projectName: string;
  projectDescription: string;
  additionalRequirements?: string;
  equipmentId: string;
  departmentId: string;
  startsAt: Date;
  endsAt: Date;
  projectDeadline: Date;
}

/**
 * Pure, testable time validation shared by the API and the tests.
 * Throws AppError with a 400 status on any invalid window.
 */
export function validateBookingWindow(
  startsAt: Date,
  endsAt: Date,
  projectDeadline: Date,
  now: Date = new Date()
): { durationMinutes: number } {
  if (
    Number.isNaN(startsAt.getTime()) ||
    Number.isNaN(endsAt.getTime()) ||
    Number.isNaN(projectDeadline.getTime())
  ) {
    throw new AppError("Please provide valid dates and times", 400, "INVALID_DATE");
  }

  const durationMinutes = (endsAt.getTime() - startsAt.getTime()) / 60_000;
  if (durationMinutes <= 0) {
    throw new AppError("End time must be after the start time", 400, "INVALID_TIME_RANGE");
  }
  if (durationMinutes < MIN_DURATION_MINUTES) {
    throw new AppError("Bookings must be at least 30 minutes long", 400, "DURATION_TOO_SHORT");
  }
  if (durationMinutes > MAX_DURATION_MINUTES) {
    throw new AppError("A single booking cannot exceed 8 hours", 400, "DURATION_TOO_LONG");
  }
  if (startsAt.getTime() < now.getTime() - 60_000) {
    throw new AppError("Start time must be in the future", 400, "START_IN_PAST");
  }
  if (startsAt.getTime() > now.getTime() + MAX_DAYS_AHEAD * 86_400_000) {
    throw new AppError("Bookings can only be requested up to 90 days ahead", 400, "TOO_FAR_AHEAD");
  }
  if (projectDeadline.getTime() < endsAt.getTime()) {
    throw new AppError(
      "Project deadline must be on or after the booking end time",
      400,
      "DEADLINE_BEFORE_BOOKING"
    );
  }

  return { durationMinutes };
}

async function getApprovedOverlaps(equipmentId: string, startsAt: Date, endsAt: Date, excludeId?: string) {
  return prisma.booking.findMany({
    where: {
      equipmentId,
      status: BookingStatus.APPROVED,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    select: { id: true, startsAt: true, endsAt: true, projectName: true },
  });
}

async function getApprovalStats(equipmentId: string, since: Date) {
  const rows = await prisma.booking.groupBy({
    by: ["userId"],
    where: { equipmentId, status: BookingStatus.APPROVED, startsAt: { gte: since } },
    _count: { _all: true },
  });
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.userId, row._count._all);
  return counts;
}

export async function computePriorityForBooking(booking: {
  id: string;
  equipmentId: string;
  projectName: string;
  projectDescription: string;
  startsAt: Date;
  endsAt: Date;
  projectDeadline: Date;
  userId: string;
  equipment: { name: string; category: string; description: string; tags: string; quantity: number };
  now?: Date;
}) {
  const now = booking.now ?? new Date();
  const approved = await getApprovedOverlaps(
    booking.equipmentId,
    booking.startsAt,
    booking.endsAt,
    booking.id
  );
  const capacityFree = Math.max(0, booking.equipment.quantity - peakConcurrency(approved, booking.startsAt, booking.endsAt));
  const since = new Date(now.getTime() - 90 * 86_400_000);
  const stats = await getApprovalStats(booking.equipmentId, since);
  const maxApprovedCount = Math.max(0, ...Array.from(stats.values()));
  const approvedCountForUser = stats.get(booking.userId) ?? 0;

  return computePriority({
    now,
    projectDeadline: booking.projectDeadline,
    projectText: `${booking.projectName} ${booking.projectDescription}`,
    equipment: booking.equipment,
    capacityFree,
    requestedDurationMinutes: (booking.endsAt.getTime() - booking.startsAt.getTime()) / 60_000,
    approvedCountForUser,
    maxApprovedCount,
  });
}

export async function createBooking(userId: string, input: CreateBookingInput) {
  const now = new Date();
  const { durationMinutes } = validateBookingWindow(input.startsAt, input.endsAt, input.projectDeadline, now);

  const equipment = await prisma.equipment.findUnique({ where: { id: input.equipmentId } });
  if (!equipment) throw new AppError("Selected equipment does not exist", 404, "EQUIPMENT_NOT_FOUND");
  if (equipment.status !== "AVAILABLE") {
    throw new AppError("This equipment is not currently available for booking", 400, "EQUIPMENT_UNAVAILABLE");
  }

  const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
  if (!department) throw new AppError("Selected department does not exist", 400, "INVALID_DEPARTMENT");

  const duplicate = await prisma.booking.findFirst({
    where: {
      userId,
      equipmentId: input.equipmentId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: { in: [BookingStatus.PENDING, BookingStatus.APPROVED] },
    },
  });
  if (duplicate) {
    throw new AppError(
      "You already have an active request for this equipment at that exact time",
      409,
      "DUPLICATE_REQUEST"
    );
  }

  const approved = await getApprovedOverlaps(input.equipmentId, input.startsAt, input.endsAt);
  const capacityFree = equipment.quantity - peakConcurrency(approved, input.startsAt, input.endsAt);
  if (capacityFree <= 0) {
    const alternatives = findAlternativeSlots({
      busy: approved,
      quantity: equipment.quantity,
      durationMinutes,
      from: input.startsAt,
      now,
      count: 3,
      exclude: { startsAt: input.startsAt, endsAt: input.endsAt },
    });
    throw new AppError(
      "All units of this equipment are already approved during that window",
      409,
      "SLOT_UNAVAILABLE",
      { alternativeSlots: alternatives }
    );
  }

  const pendingOverlaps = await prisma.booking.count({
    where: {
      equipmentId: input.equipmentId,
      status: BookingStatus.PENDING,
      startsAt: { lt: input.endsAt },
      endsAt: { gt: input.startsAt },
    },
  });

  const booking = await prisma.booking.create({
    data: {
      projectName: input.projectName.trim(),
      projectDescription: input.projectDescription.trim(),
      additionalRequirements: input.additionalRequirements?.trim() || null,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      projectDeadline: input.projectDeadline,
      equipmentId: input.equipmentId,
      departmentId: input.departmentId,
      userId,
      status: BookingStatus.PENDING,
    },
    include: bookingInclude,
  });

  const warnings =
    pendingOverlaps > 0
      ? [
          `${pendingOverlaps} other pending request(s) overlap this window. Faculty will review them together using the priority model.`,
        ]
      : [];

  return { booking: serializeBooking(booking), warnings };
}

export async function listBookings(
  user: { id: string; role: Role },
  filters: { status?: string; equipmentId?: string; limit?: number }
) {
  const where: Prisma.BookingWhereInput = {};
  if (user.role === "STUDENT") where.userId = user.id;
  if (filters.status) where.status = filters.status as BookingStatus;
  if (filters.equipmentId) where.equipmentId = filters.equipmentId;

  const bookings = await prisma.booking.findMany({
    where,
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
    take: Math.min(filters.limit ?? 100, 200),
  });
  return bookings.map(serializeBooking);
}

export async function getBooking(id: string) {
  const booking = await prisma.booking.findUnique({ where: { id }, include: bookingInclude });
  if (!booking) throw new AppError("Booking not found", 404, "NOT_FOUND");
  return serializeBooking(booking);
}

export async function cancelBooking(id: string, user: { id: string; role: Role }) {
  const booking = await prisma.booking.findUnique({ where: { id }, include: bookingInclude });
  if (!booking) throw new AppError("Booking not found", 404, "NOT_FOUND");
  if (user.role !== "ADMIN" && booking.userId !== user.id) {
    throw new AppError("You can only cancel your own bookings", 403, "FORBIDDEN");
  }
  if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.APPROVED) {
    throw new AppError("Only pending or approved bookings can be cancelled", 409, "INVALID_STATUS");
  }
  if (booking.endsAt.getTime() < Date.now()) {
    throw new AppError("This booking has already ended", 409, "BOOKING_ENDED");
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: BookingStatus.CANCELLED },
    include: bookingInclude,
  });
  return serializeBooking(updated);
}

export async function approveBooking(id: string, reviewerId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { ...bookingInclude, equipment: true },
  });
  if (!booking) throw new AppError("Booking not found", 404, "NOT_FOUND");
  if (booking.status !== BookingStatus.PENDING) {
    throw new AppError("Only pending requests can be approved", 409, "INVALID_STATUS");
  }

  const approved = await getApprovedOverlaps(
    booking.equipmentId,
    booking.startsAt,
    booking.endsAt,
    booking.id
  );
  const capacityFree =
    booking.equipment.quantity - peakConcurrency(approved, booking.startsAt, booking.endsAt);
  if (capacityFree <= 0) {
    const durationMinutes = (booking.endsAt.getTime() - booking.startsAt.getTime()) / 60_000;
    const alternatives = findAlternativeSlots({
      busy: approved,
      quantity: booking.equipment.quantity,
      durationMinutes,
      from: booking.startsAt,
      now: new Date(),
      count: 3,
      exclude: { startsAt: booking.startsAt, endsAt: booking.endsAt },
    });
    throw new AppError(
      "Approving this request would double-book the equipment. Choose an alternative slot or reject the request.",
      409,
      "CAPACITY_CONFLICT",
      {
        conflictingBookings: approved.map((item) => ({
          id: item.id,
          projectName: item.projectName,
          startsAt: item.startsAt,
          endsAt: item.endsAt,
        })),
        alternativeSlots: alternatives,
      }
    );
  }

  const priority = await computePriorityForBooking({
    ...booking,
    equipment: {
      name: booking.equipment.name,
      category: booking.equipment.category,
      description: booking.equipment.description,
      tags: booking.equipment.tags,
      quantity: booking.equipment.quantity,
    },
  });

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: BookingStatus.APPROVED,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      priorityScore: priority.score,
      priorityBreakdown: JSON.stringify(priority.breakdown),
    },
    include: bookingInclude,
  });
  return { booking: serializeBooking(updated), priority };
}

export async function rejectBooking(id: string, reviewerId: string, reason: string) {
  const trimmed = reason?.trim() ?? "";
  if (trimmed.length < 5) {
    throw new AppError("Please provide a rejection reason of at least 5 characters", 400, "REASON_REQUIRED");
  }
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new AppError("Booking not found", 404, "NOT_FOUND");
  if (booking.status !== BookingStatus.PENDING) {
    throw new AppError("Only pending requests can be rejected", 409, "INVALID_STATUS");
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: BookingStatus.REJECTED,
      rejectionReason: trimmed,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
    },
    include: bookingInclude,
  });
  return serializeBooking(updated);
}

export async function completeBooking(id: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new AppError("Booking not found", 404, "NOT_FOUND");
  if (booking.status !== BookingStatus.APPROVED || booking.endsAt.getTime() > Date.now()) {
    throw new AppError("Only approved bookings whose end time has passed can be completed", 409, "INVALID_STATUS");
  }
  const updated = await prisma.booking.update({
    where: { id },
    data: { status: BookingStatus.COMPLETED },
    include: bookingInclude,
  });
  return serializeBooking(updated);
}

export function readBreakdown(value: string | null): PriorityBreakdown | null {
  return parseJson<PriorityBreakdown | null>(value, null);
}

export type { Interval };
