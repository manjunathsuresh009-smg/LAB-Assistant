import { Request, Response } from "express";
import { asyncHandler } from "../utils/errors";
import {
  createEquipment,
  getEquipmentDetail,
  getEquipmentMeta,
  listEquipment,
  updateEquipment,
  EquipmentFilters,
} from "../services/equipmentService";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const equipment = await listEquipment(req.query as unknown as EquipmentFilters);
  res.json({ success: true, data: { equipment } });
});

export const meta = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getEquipmentMeta();
  res.json({ success: true, data });
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
  const equipment = await getEquipmentDetail(req.params.id);
  res.json({ success: true, data: { equipment } });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const equipment = await createEquipment(req.body);
  res.status(201).json({ success: true, data: { equipment } });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const equipment = await updateEquipment(req.params.id, req.body);
  res.json({ success: true, data: { equipment } });
});
