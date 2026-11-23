import { Request, Response } from "express";
import { asyncHandler } from "../utils/errors";
import { getUserProfile, loginUser, registerUser } from "../services/authService";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await registerUser(req.body);
  res.status(201).json({ success: true, data: result });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  res.json({ success: true, data: result });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserProfile(req.user!.id);
  res.json({ success: true, data: { user } });
});
