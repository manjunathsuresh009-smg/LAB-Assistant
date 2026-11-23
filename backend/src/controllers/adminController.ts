import { Request, Response } from "express";
import { prisma } from "../prisma";
import { asyncHandler } from "../utils/errors";
import { serializeBooking, serializeUser } from "../utils/serializers";
import { bookingInclude } from "../services/bookingService";

export const users = asyncHandler(async (req: Request, res: Response) => {
  const role = req.query.role as string | undefined;
  const rows = await prisma.user.findMany({
    where: role ? { role: role as "STUDENT" | "FACULTY" | "ADMIN" } : undefined,
    include: { department: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, data: { users: rows.map(serializeUser) } });
});

export const bookings = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await prisma.booking.findMany({
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json({ success: true, data: { bookings: rows.map(serializeBooking) } });
});

export const departments = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await prisma.department.findMany({
    include: { _count: { select: { equipment: true, users: true } } },
    orderBy: { name: "asc" },
  });
  res.json({
    success: true,
    data: {
      departments: rows.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        description: row.description,
        equipmentCount: row._count.equipment,
        userCount: row._count.users,
      })),
    },
  });
});

export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const department = await prisma.department.create({
    data: {
      name: req.body.name,
      code: String(req.body.code).toUpperCase(),
      description: req.body.description ?? null,
    },
  });
  res.status(201).json({ success: true, data: { department } });
});
