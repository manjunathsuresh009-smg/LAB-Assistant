import { Request, Response } from "express";
import { asyncHandler } from "../utils/errors";
import {
  cancelBooking,
  completeBooking,
  createBooking,
  listBookings,
} from "../services/bookingService";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const bookings = await listBookings(req.user!, req.query);
  res.json({ success: true, data: { bookings } });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await createBooking(req.user!.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const booking = await cancelBooking(req.params.id, req.user!);
  res.json({ success: true, data: { booking } });
});

export const complete = asyncHandler(async (req: Request, res: Response) => {
  const booking = await completeBooking(req.params.id);
  res.json({ success: true, data: { booking } });
});
