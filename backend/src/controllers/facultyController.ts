import { Request, Response } from "express";
import { asyncHandler } from "../utils/errors";
import { approveBooking, listBookings, rejectBooking } from "../services/bookingService";

export const requests = asyncHandler(async (req: Request, res: Response) => {
  const bookings = await listBookings(req.user!, req.query);
  res.json({ success: true, data: { bookings } });
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const result = await approveBooking(req.params.id, req.user!.id);
  res.json({ success: true, data: result });
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const booking = await rejectBooking(req.params.id, req.user!.id, req.body.reason);
  res.json({ success: true, data: { booking } });
});
