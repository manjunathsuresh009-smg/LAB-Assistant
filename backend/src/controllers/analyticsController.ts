import { Request, Response } from "express";
import { asyncHandler } from "../utils/errors";
import { getDashboardAnalytics, getUtilisationAnalytics } from "../services/analyticsService";

export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getDashboardAnalytics();
  res.json({ success: true, data });
});

export const utilisation = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getUtilisationAnalytics();
  res.json({ success: true, data });
});
