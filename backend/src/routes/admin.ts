import { Router } from "express";
import {
  bookings,
  createDepartment,
  departments,
  users,
} from "../controllers/adminController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createDepartmentSchema, userQuerySchema } from "../validators";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/users", validate(userQuerySchema, "query"), users);
router.get("/bookings", bookings);
router.get("/departments", departments);
router.post("/departments", validate(createDepartmentSchema), createDepartment);

export default router;
