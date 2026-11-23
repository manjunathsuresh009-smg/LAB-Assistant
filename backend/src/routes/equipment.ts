import { Router } from "express";
import { create, detail, list, meta, update } from "../controllers/equipmentController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createEquipmentSchema,
  equipmentQuerySchema,
  updateEquipmentSchema,
} from "../validators";

const router = Router();

router.get("/", validate(equipmentQuerySchema, "query"), list);
router.get("/meta", meta);
router.get("/:id", detail);

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createEquipmentSchema),
  create
);
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(updateEquipmentSchema),
  update
);

export default router;
