import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../utils/errors";
import { computePriority, PRIORITY_WEIGHTS, PriorityBreakdown, PriorityResult } from "./scoring";
import { findAlternativeSlots, Interval, intervalsOverlap, peakConcurrency } from "./scheduling";

type PendingBooking = Prisma.BookingGetPayload<{
  include: {
    equipment: { include: { department: true } };
    department: true;
    user: { select: { id: true; name: true; email: true; department: true } };
  };
}>;

interface Candidate {
  bookingId: string;
  projectName: string;
  projectDescription: string;
  startsAt: Date;
  endsAt: Date;
  projectDeadline: Date;
  requestedDurationMinutes: number;
  student: { id: string; name: string; email: string; department: string | null };
  priority: PriorityResult;
  recommendation: "APPROVE" | "DEFER";
  explanation: string;
  alternativeSlots: Array<{ startsAt: Date; endsAt: Date }>;
  alternativeEquipment: Array<{
    id: string;
    name: string;
    category: string;
    location: string;
    department: string;
    freeUnits: number;
  }>;
}

function clusterByOverlap(bookings: PendingBooking[]): PendingBooking[][] {
  const parent = bookings.map((_, index) => index);
  const find = (index: number): number => {
    let current = index;
    while (parent[current] !== current) {
      parent[current] = parent[parent[current]];
      current = parent[current];
    }
    return current;
  };
  const union = (a: number, b: number) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent[rootB] = rootA;
  };

  for (let i = 0; i < bookings.length; i += 1) {
    for (let j = i + 1; j < bookings.length; j += 1) {
      if (
        intervalsOverlap(
          bookings[i].startsAt,
          bookings[i].endsAt,
          bookings[j].startsAt,
          bookings[j].endsAt
        )
      ) {
        union(i, j);
      }
    }
  }

  const groups = new Map<number, PendingBooking[]>();
  bookings.forEach((booking, index) => {
    const root = find(index);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(booking);
  });
  return Array.from(groups.values());
}

type FactorKey = keyof PriorityBreakdown;

function topDriver(priority: PriorityResult): { label: string; key: FactorKey; value: number } {
  const entries: Array<{ label: string; key: FactorKey; value: number }> = [
    { label: "deadline urgency", key: "deadlineUrgency", value: priority.breakdown.deadlineUrgency.weighted },
    { label: "equipment compatibility", key: "compatibility", value: priority.breakdown.compatibility.weighted },
    { label: "availability feasibility", key: "availability", value: priority.breakdown.availability.weighted },
    { label: "fairness", key: "fairness", value: priority.breakdown.fairness.weighted },
  ];
  return entries.sort((a, b) => b.value - a.value)[0];
}

export interface ResolveConflictsOptions {
  equipmentId?: string;
  date?: string;
}

export async function resolveConflicts(options: ResolveConflictsOptions) {
  const now = new Date();
  let dateWindow: { start: Date; end: Date } | null = null;

  if (options.date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(options.date)) {
      throw new AppError("date must use the YYYY-MM-DD format", 400, "INVALID_DATE");
    }
    const start = new Date(`${options.date}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime())) {
      throw new AppError("Invalid date supplied", 400, "INVALID_DATE");
    }
    dateWindow = { start, end: new Date(start.getTime() + 86_400_000) };
  }

  const where: Prisma.BookingWhereInput = { status: BookingStatus.PENDING };
  if (options.equipmentId) where.equipmentId = options.equipmentId;
  if (dateWindow) {
    where.startsAt = { lt: dateWindow.end };
    where.endsAt = { gt: dateWindow.start };
  }

  const pending: PendingBooking[] = await prisma.booking.findMany({
    where,
    include: {
      equipment: { include: { department: true } },
      department: true,
      user: { select: { id: true, name: true, email: true, department: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  const approved = await prisma.booking.findMany({
    where: { status: BookingStatus.APPROVED },
    select: { equipmentId: true, startsAt: true, endsAt: true },
  });

  const approvedByEquipment = new Map<string, Interval[]>();
  for (const booking of approved) {
    if (!approvedByEquipment.has(booking.equipmentId)) approvedByEquipment.set(booking.equipmentId, []);
    approvedByEquipment.get(booking.equipmentId)!.push({
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
    });
  }

  const since = new Date(now.getTime() - 90 * 86_400_000);
  const approvalRows = await prisma.booking.groupBy({
    by: ["userId"],
    where: { status: BookingStatus.APPROVED, startsAt: { gte: since } },
    _count: { _all: true },
  });
  const approvalCounts = new Map<string, number>();
  for (const row of approvalRows) approvalCounts.set(row.userId, row._count._all);

  const pendingByEquipment = new Map<string, PendingBooking[]>();
  for (const booking of pending) {
    if (!pendingByEquipment.has(booking.equipmentId)) pendingByEquipment.set(booking.equipmentId, []);
    pendingByEquipment.get(booking.equipmentId)!.push(booking);
  }

  const groups: Array<Record<string, unknown>> = [];
  let recommendedApprovals = 0;
  let deferred = 0;

  for (const [equipmentId, equipmentPending] of pendingByEquipment) {
    const equipment = equipmentPending[0].equipment;
    const equipmentApproved = approvedByEquipment.get(equipmentId) ?? [];

    for (const cluster of clusterByOverlap(equipmentPending)) {
      const maxApprovedCount = Math.max(
        0,
        ...cluster.map((item) => approvalCounts.get(item.userId) ?? 0)
      );

      const scored = cluster
        .map((item) => {
          const itemCapacityFree = Math.max(
            0,
            equipment.quantity - peakConcurrency(equipmentApproved, item.startsAt, item.endsAt)
          );
          const priority = computePriority({
            now,
            projectDeadline: item.projectDeadline,
            projectText: `${item.projectName} ${item.projectDescription}`,
            equipment,
            capacityFree: itemCapacityFree,
            requestedDurationMinutes:
              (item.endsAt.getTime() - item.startsAt.getTime()) / 60_000,
            approvedCountForUser: approvalCounts.get(item.userId) ?? 0,
            maxApprovedCount,
          });
          return { item, priority };
        })
        .sort((a, b) => {
          if (b.priority.score !== a.priority.score) return b.priority.score - a.priority.score;
          if (a.item.projectDeadline.getTime() !== b.item.projectDeadline.getTime()) {
            return a.item.projectDeadline.getTime() - b.item.projectDeadline.getTime();
          }
          return a.item.createdAt.getTime() - b.item.createdAt.getTime();
        });

      const accepted: Interval[] = [];
      const candidates: Candidate[] = [];

      for (const { item, priority } of scored) {
        const provisionalPeak = peakConcurrency(
          [...equipmentApproved, ...accepted],
          item.startsAt,
          item.endsAt
        );
        const canApprove = provisionalPeak < equipment.quantity;
        const durationMinutes = (item.endsAt.getTime() - item.startsAt.getTime()) / 60_000;

        if (canApprove) {
          accepted.push({ startsAt: item.startsAt, endsAt: item.endsAt });
          recommendedApprovals += 1;
        } else {
          deferred += 1;
        }

        const alternativeSlots = canApprove
          ? []
          : findAlternativeSlots({
              busy: [...equipmentApproved, ...accepted],
              quantity: equipment.quantity,
              durationMinutes,
              from: item.startsAt,
              now,
              count: 3,
              exclude: { startsAt: item.startsAt, endsAt: item.endsAt },
            });

        let alternativeEquipment: Candidate["alternativeEquipment"] = [];
        if (!canApprove) {
          const alternatives = await prisma.equipment.findMany({
            where: {
              id: { not: equipment.id },
              status: "AVAILABLE",
              OR: [
                { category: equipment.category },
                ...(equipment.tags
                  ? equipment.tags
                      .split(",")
                      .slice(0, 2)
                      .map((tag) => ({ tags: { contains: tag.trim() } }))
                  : []),
              ],
            },
            include: { department: true },
            take: 6,
          });
          alternativeEquipment = alternatives
            .map((alt) => {
              const altBusy = approvedByEquipment.get(alt.id) ?? [];
              const freeUnits = alt.quantity - peakConcurrency(altBusy, item.startsAt, item.endsAt);
              return {
                id: alt.id,
                name: alt.name,
                category: alt.category,
                location: alt.location,
                department: alt.department.name,
                freeUnits: Math.max(0, freeUnits),
              };
            })
            .filter((alt) => alt.freeUnits > 0)
            .slice(0, 3);
        }

        const driver = topDriver(priority);
        const explanation = canApprove
          ? `Priority ${priority.score}/100. Fits available capacity. Strongest factor: ${driver.label} (${Math.round(driver.value)} weighted points). ${priority.breakdown.deadlineUrgency.reason}`
          : `Priority ${priority.score}/100. No capacity remains once higher-ranked requests are placed. ${driver.label} is the leading factor, but the requested window is contended. Offer an alternative slot or compatible equipment.`;

        candidates.push({
          bookingId: item.id,
          projectName: item.projectName,
          projectDescription: item.projectDescription,
          startsAt: item.startsAt,
          endsAt: item.endsAt,
          projectDeadline: item.projectDeadline,
          requestedDurationMinutes: durationMinutes,
          student: {
            id: item.user.id,
            name: item.user.name,
            email: item.user.email,
            department: item.user.department?.name ?? null,
          },
          priority,
          recommendation: canApprove ? "APPROVE" : "DEFER",
          explanation,
          alternativeSlots,
          alternativeEquipment,
        });
      }

      const top = candidates[0];
      const second = candidates[1];
      let summary: string;
      if (!top) {
        summary = "No candidates to allocate.";
      } else if (!second) {
        summary =
          top.recommendation === "APPROVE"
            ? "Only one pending request in this window and capacity is available, so it is recommended for approval. Faculty approval is still required."
            : "Capacity is fully committed by approved bookings, so this request needs an alternative slot.";
      } else {
        const driver = topDriver(top.priority);
        const secondScore = second.priority.breakdown[driver.key].score;
        summary = `${top.student.name} ranks first with ${top.priority.score}/100 versus ${second.priority.score}/100 for ${second.student.name}. The strongest differentiator is ${driver.label} (${top.priority.breakdown[driver.key].score.toFixed(1)} vs ${secondScore.toFixed(1)}). ${
          top.recommendation === "DEFER"
            ? "No capacity remains, so both requests should be deferred with alternatives."
            : `${top.student.name} is recommended for the contested slot.`
        } Faculty makes the final decision.`;
      }

      groups.push({
        equipment: {
          id: equipment.id,
          name: equipment.name,
          category: equipment.category,
          location: equipment.location,
          quantity: equipment.quantity,
          department: equipment.department,
        },
        conflictDetected: cluster.length > 1,
        recommendedOrder: candidates.map((candidate) => ({
          bookingId: candidate.bookingId,
          student: candidate.student.name,
          priority: candidate.priority.score,
          recommendation: candidate.recommendation,
        })),
        candidates,
        summary,
      });
    }
  }

  return {
    engine: "deterministic-priority-model",
    weights: PRIORITY_WEIGHTS,
    generatedAt: now,
    summary:
      pending.length === 0
        ? "There are no pending requests to resolve right now."
        : `Analyzed ${pending.length} pending request(s) across ${groups.length} equipment group(s). ${recommendedApprovals} can be approved within capacity and ${deferred} should be deferred with an alternative. Faculty sign-off is required for every approval.`,
    groups: groups.sort((a, b) => Number(b.conflictDetected) - Number(a.conflictDetected)),
  };
}
