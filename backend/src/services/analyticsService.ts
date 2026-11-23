import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "../prisma";

const PAST_DAYS = 7;
const FUTURE_DAYS = 7;
const WINDOW_DAYS = PAST_DAYS + FUTURE_DAYS;
const OPERATING_HOURS_PER_DAY = 10;

type EquipmentWithDepartment = Prisma.EquipmentGetPayload<{ include: { department: true } }>;
type BookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    equipment: { include: { department: true } };
    user: { select: { name: true; email: true } };
    department: true;
  };
}>;

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function overlapHours(startsAt: Date, endsAt: Date, windowStart: Date, windowEnd: Date): number {
  const start = Math.max(startsAt.getTime(), windowStart.getTime());
  const end = Math.min(endsAt.getTime(), windowEnd.getTime());
  return Math.max(0, end - start) / 3_600_000;
}

function utilisationPercent(bookedHours: number, units: number): number {
  const capacity = units * OPERATING_HOURS_PER_DAY * WINDOW_DAYS;
  if (capacity <= 0) return 0;
  return round(Math.min(100, (bookedHours / capacity) * 100));
}

const ACTIVE_STATUSES: BookingStatus[] = [BookingStatus.APPROVED, BookingStatus.COMPLETED];

export async function buildAnalytics(now = new Date()) {
  const windowStart = new Date(now.getTime() - PAST_DAYS * 86_400_000);
  const windowEnd = new Date(now.getTime() + FUTURE_DAYS * 86_400_000);

  const [departments, equipment, bookings, totalUsers, studentCount] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.equipment.findMany({ include: { department: true } }),
    prisma.booking.findMany({
      include: {
        equipment: { include: { department: true } },
        user: { select: { name: true, email: true } },
        department: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
  ]);

  const activeBookings = bookings.filter(
    (booking) =>
      ACTIVE_STATUSES.includes(booking.status) &&
      booking.startsAt.getTime() <= now.getTime() &&
      booking.endsAt.getTime() > now.getTime()
  );

  const utilisationRows = equipment.map((item) => {
    const itemsBookings = bookings.filter(
      (booking) => booking.equipmentId === item.id && ACTIVE_STATUSES.includes(booking.status)
    );
    const bookedHours = itemsBookings.reduce(
      (total, booking) => total + overlapHours(booking.startsAt, booking.endsAt, windowStart, windowEnd),
      0
    );
    return {
      equipment: item,
      bookedHours: round(bookedHours),
      utilisationPercent: utilisationPercent(bookedHours, item.quantity),
    };
  });

  const totalBookedHours = utilisationRows.reduce((total, row) => total + row.bookedHours, 0);
  const totalUnits = equipment.reduce((total, item) => total + item.quantity, 0);
  const utilisationPercentOverall = utilisationPercent(totalBookedHours, totalUnits);

  const departmentDistribution = departments.map((department) => {
    const deptEquipment = equipment.filter((item) => item.departmentId === department.id);
    return {
      name: department.name,
      code: department.code,
      equipmentCount: deptEquipment.length,
      units: deptEquipment.reduce((total, item) => total + item.quantity, 0),
    };
  });

  const byDepartment = departments.map((department) => {
    const deptRows = utilisationRows.filter((row) => row.equipment.departmentId === department.id);
    const bookedHours = deptRows.reduce((total, row) => total + row.bookedHours, 0);
    const units = deptRows.reduce((total, row) => total + row.equipment.quantity, 0);
    return {
      name: department.name,
      code: department.code,
      bookedHours: round(bookedHours),
      units,
      utilisationPercent: utilisationPercent(bookedHours, units),
    };
  });

  const byEquipment = utilisationRows
    .map((row) => ({
      id: row.equipment.id,
      name: row.equipment.name,
      category: row.equipment.category,
      department: row.equipment.department.name,
      quantity: row.equipment.quantity,
      bookedHours: row.bookedHours,
      utilisationPercent: row.utilisationPercent,
    }))
    .sort((a, b) => b.utilisationPercent - a.utilisationPercent);

  const dayActivity: Array<{ date: string; label: string; bookings: number }> = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(now.getTime() - offset * 86_400_000);
    const key = day.toISOString().slice(0, 10);
    dayActivity.push({
      date: key,
      label: day.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      bookings: bookings.filter((booking) => booking.startsAt.toISOString().slice(0, 10) === key)
        .length,
    });
  }

  const requestCounts = new Map<string, number>();
  for (const booking of bookings) {
    if (booking.status === BookingStatus.CANCELLED) continue;
    requestCounts.set(booking.equipmentId, (requestCounts.get(booking.equipmentId) ?? 0) + 1);
  }
  const mostRequested = equipment
    .map((item) => ({
      id: item.id,
      name: item.name,
      department: item.department.name,
      count: requestCounts.get(item.id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const recentActivity = bookings.slice(0, 8).map((booking) => ({
    id: booking.id,
    projectName: booking.projectName,
    status: booking.status,
    createdAt: booking.createdAt,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    student: booking.user.name,
    equipment: booking.equipment.name,
  }));

  const monthlyUsage: Array<{ month: string; label: string; hours: number }> = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const key = date.toISOString().slice(0, 7);
    const hours = bookings
      .filter(
        (booking) =>
          ACTIVE_STATUSES.includes(booking.status) &&
          booking.startsAt.toISOString().slice(0, 7) === key
      )
      .reduce(
        (total, booking) =>
          total + (booking.endsAt.getTime() - booking.startsAt.getTime()) / 3_600_000,
        0
      );
    monthlyUsage.push({
      month: key,
      label: date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
      hours: round(hours),
    });
  }

  const underutilised = byEquipment
    .filter((row) => row.utilisationPercent < 5)
    .slice(0, 6);

  const pendingRequests = bookings.filter((booking) => booking.status === BookingStatus.PENDING);

  const recommendations: Array<{ title: string; detail: string; tone: "opportunity" | "warning" | "info" }> = [];
  const topDemand = mostRequested[0];
  if (topDemand && topDemand.count > 0) {
    recommendations.push({
      title: `High demand on ${topDemand.name}`,
      detail: `${topDemand.name} (${topDemand.department}) has ${topDemand.count} request(s). Consider adding units or extending opening hours during project periods.`,
      tone: "warning",
    });
  }
  if (underutilised[0]) {
    recommendations.push({
      title: `Promote ${underutilised[0].name}`,
      detail: `${underutilised[0].name} from ${underutilised[0].department} is only ${underutilised[0].utilisationPercent}% utilised. Promote it to project teams that need ${underutilised[0].category.toLowerCase()} resources.`,
      tone: "opportunity",
    });
  }
  const busiestDepartment = [...byDepartment].sort(
    (a, b) => b.utilisationPercent - a.utilisationPercent
  )[0];
  if (busiestDepartment) {
    recommendations.push({
      title: `Share capacity with ${busiestDepartment.code}`,
      detail: `${busiestDepartment.name} is at ${busiestDepartment.utilisationPercent}% utilisation. Coordinate cross-department lending for peak project weeks.`,
      tone: "info",
    });
  }
  if (pendingRequests.length > 0) {
    recommendations.push({
      title: `${pendingRequests.length} request(s) waiting for review`,
      detail: "Run the conflict resolution engine to rank overlapping requests before faculty approval.",
      tone: "info",
    });
  }

  return {
    generatedAt: now,
    window: {
      start: windowStart,
      end: windowEnd,
      days: WINDOW_DAYS,
      operatingHoursPerDay: OPERATING_HOURS_PER_DAY,
    },
    counts: {
      equipment: equipment.length,
      availableEquipment: equipment.filter((item) => item.status === "AVAILABLE").length,
      activeBookings: activeBookings.length,
      pendingRequests: pendingRequests.length,
      departments: departments.length,
      totalBookings: bookings.length,
      approvedBookings: bookings.filter((booking) => booking.status === BookingStatus.APPROVED).length,
      users: totalUsers,
      students: studentCount,
    },
    utilisationPercent: utilisationPercentOverall,
    departmentDistribution,
    byEquipment,
    byDepartment,
    mostRequested,
    bookingActivity: dayActivity,
    monthlyUsage,
    recentActivity,
    underutilised,
    recommendations,
  };
}

export async function getDashboardAnalytics() {
  const analytics = await buildAnalytics();
  return {
    counts: analytics.counts,
    utilisationPercent: analytics.utilisationPercent,
    window: analytics.window,
    departmentDistribution: analytics.departmentDistribution,
    utilisationByEquipment: analytics.byEquipment.slice(0, 6).map((row) => ({
      name: row.name,
      percent: row.utilisationPercent,
    })),
    bookingActivity: analytics.bookingActivity,
    mostRequested: analytics.mostRequested.slice(0, 6),
    recentActivity: analytics.recentActivity,
    recommendations: analytics.recommendations.slice(0, 3),
    generatedAt: analytics.generatedAt,
  };
}

export async function getUtilisationAnalytics() {
  const analytics = await buildAnalytics();
  return {
    utilisationPercent: analytics.utilisationPercent,
    window: analytics.window,
    byEquipment: analytics.byEquipment,
    byDepartment: analytics.byDepartment,
    underutilised: analytics.underutilised,
    mostRequested: analytics.mostRequested,
    monthlyUsage: analytics.monthlyUsage,
    recommendations: analytics.recommendations,
    generatedAt: analytics.generatedAt,
  };
}
