import { EquipmentStatus, Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../utils/errors";
import { serializeEquipment } from "../utils/serializers";
import { peakConcurrency } from "./scheduling";

export interface EquipmentFilters {
  q?: string;
  department?: string;
  category?: string;
  available?: string;
  sort?: string;
}

export async function listEquipment(filters: EquipmentFilters) {
  const where: Prisma.EquipmentWhereInput = {};
  const and: Prisma.EquipmentWhereInput[] = [];

  if (filters.q) {
    const q = filters.q.trim();
    and.push({
      OR: [
        { name: { contains: q } },
        { description: { contains: q } },
        { tags: { contains: q } },
        { category: { contains: q } },
        { location: { contains: q } },
      ],
    });
  }

  if (filters.department) {
    const value = filters.department;
    and.push({ department: { is: { OR: [{ id: value }, { code: value }, { name: value }] } } });
  }

  if (filters.category) {
    and.push({ category: filters.category });
  }

  if (filters.available === "true") {
    and.push({ status: EquipmentStatus.AVAILABLE });
  }

  if (and.length) where.AND = and;

  const orderBy: Prisma.EquipmentOrderByWithRelationInput =
    filters.sort === "newest"
      ? { createdAt: "desc" }
      : filters.sort === "category"
        ? { category: "asc" }
        : filters.sort === "department"
          ? { department: { name: "asc" } }
          : { name: "asc" };

  const equipment = await prisma.equipment.findMany({
    where,
    include: { department: true },
    orderBy,
  });

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const approved = await prisma.booking.findMany({
    where: {
      status: "APPROVED",
      equipmentId: { in: equipment.map((item) => item.id) },
      startsAt: { lte: windowEnd },
      endsAt: { gte: now },
    },
    select: { equipmentId: true, startsAt: true, endsAt: true },
  });

  return equipment.map((item) => {
    const busy = approved.filter((booking) => booking.equipmentId === item.id);
    const busyNow = busy.filter(
      (booking) => booking.startsAt.getTime() <= now.getTime() && booking.endsAt.getTime() > now.getTime()
    ).length;
    const upcomingBusy = peakConcurrency(
      busy,
      now,
      new Date(now.getTime() + 24 * 60 * 60 * 1000)
    );
    return {
      ...serializeEquipment(item),
      availableUnitsNow:
        item.status === EquipmentStatus.AVAILABLE ? Math.max(0, item.quantity - busyNow) : 0,
      busyNext24h: upcomingBusy,
    };
  });
}

export async function getEquipmentDetail(idOrSlug: string) {
  const equipment = await prisma.equipment.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: { department: true },
  });
  if (!equipment) throw new AppError("Equipment not found", 404, "NOT_FOUND");

  const now = new Date();
  const horizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcoming = await prisma.booking.findMany({
    where: { equipmentId: equipment.id, status: "APPROVED", endsAt: { gte: now }, startsAt: { lte: horizon } },
    select: { startsAt: true, endsAt: true },
    orderBy: { startsAt: "asc" },
  });

  const busyNow = upcoming.filter(
    (booking) => booking.startsAt.getTime() <= now.getTime() && booking.endsAt.getTime() > now.getTime()
  ).length;

  return {
    ...serializeEquipment(equipment),
    availableUnitsNow: Math.max(0, equipment.quantity - busyNow),
    upcomingApprovedSlots: upcoming,
  };
}

export async function getEquipmentMeta() {
  const [departments, categories] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.equipment.findMany({ distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } }),
  ]);
  return { departments, categories: categories.map((row) => row.category) };
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function createEquipment(input: {
  name: string;
  description: string;
  category: string;
  location: string;
  departmentId: string;
  quantity: number;
  tags: string[];
  specs: Record<string, string>;
  status?: EquipmentStatus;
}) {
  const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
  if (!department) throw new AppError("Department not found", 400, "INVALID_DEPARTMENT");

  let slug = slugify(input.name);
  const existing = await prisma.equipment.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const equipment = await prisma.equipment.create({
    data: {
      name: input.name.trim(),
      slug,
      description: input.description.trim(),
      category: input.category.trim(),
      location: input.location.trim(),
      departmentId: input.departmentId,
      quantity: input.quantity,
      status: input.status ?? EquipmentStatus.AVAILABLE,
      tags: input.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean).join(","),
      specs: JSON.stringify(input.specs ?? {}),
    },
    include: { department: true },
  });
  return serializeEquipment(equipment);
}

export async function updateEquipment(
  id: string,
  input: Partial<{
    name: string;
    description: string;
    category: string;
    location: string;
    departmentId: string;
    quantity: number;
    tags: string[];
    specs: Record<string, string>;
    status: EquipmentStatus;
  }>
) {
  const existing = await prisma.equipment.findUnique({ where: { id } });
  if (!existing) throw new AppError("Equipment not found", 404, "NOT_FOUND");

  if (input.departmentId) {
    const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
    if (!department) throw new AppError("Department not found", 400, "INVALID_DEPARTMENT");
  }

  const equipment = await prisma.equipment.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.category !== undefined ? { category: input.category.trim() } : {}),
      ...(input.location !== undefined ? { location: input.location.trim() } : {}),
      ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
      ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.tags !== undefined
        ? { tags: input.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean).join(",") }
        : {}),
      ...(input.specs !== undefined ? { specs: JSON.stringify(input.specs) } : {}),
    },
    include: { department: true },
  });
  return serializeEquipment(equipment);
}
