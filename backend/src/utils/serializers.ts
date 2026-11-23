import { Booking, Department, Equipment, User } from "@prisma/client";

type BookingWithRelations = Booking & {
  equipment?: Equipment | null;
  user?: (Pick<User, "id" | "name" | "email" | "role"> & { department?: Department | null }) | null;
  department?: Department | null;
  reviewedBy?: Pick<User, "id" | "name"> | null;
};

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function serializeEquipment(equipment: Equipment & { department?: Department | null }) {
  const { tags, specs, ...rest } = equipment;
  return {
    ...rest,
    tags: tags ? tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
    specs: parseJson<Record<string, string>>(specs, {}),
  };
}

export function serializeBooking(booking: BookingWithRelations) {
  const { priorityBreakdown, ...rest } = booking;
  return {
    ...rest,
    priorityBreakdown: parseJson<unknown>(priorityBreakdown, null),
    equipment: booking.equipment ? serializeEquipment(booking.equipment) : undefined,
    user: booking.user
      ? {
          id: booking.user.id,
          name: booking.user.name,
          email: booking.user.email,
          role: booking.user.role,
          department: booking.user.department ?? null,
        }
      : undefined,
    reviewedBy: booking.reviewedBy ?? null,
  };
}

export function serializeUser(user: User & { department?: Department | null }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
    department: user.department ?? null,
    createdAt: user.createdAt,
  };
}
