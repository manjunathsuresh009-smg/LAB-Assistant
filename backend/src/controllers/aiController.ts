import { Request, Response } from "express";
import { asyncHandler } from "../utils/errors";
import { recommendEquipment } from "../services/aiService";
import { resolveConflicts } from "../services/conflictService";

export const recommend = asyncHandler(async (req: Request, res: Response) => {
  const result = await recommendEquipment(req.body.description);
  res.json({ success: true, data: result });
});

export const resolve = asyncHandler(async (req: Request, res: Response) => {
  const result = await resolveConflicts(req.body);
  res.json({ success: true, data: result });
});
