import { Request, Response } from "express";
import { prisma } from "../prisma";
import { asyncHandler } from "../utils/errors";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
  res.json({ success: true, data: { departments } });
});
