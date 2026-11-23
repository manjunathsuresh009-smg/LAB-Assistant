import { Router } from "express";
import { cancel, complete, create, list } from "../controllers/bookingController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { bookingQuerySchema, createBookingSchema } from "../validators";

const router = Router();

router.use(authenticate);

router.get("/", validate(bookingQuerySchema, "query"), list);
router.post("/", authorize("STUDENT", "ADMIN"), validate(createBookingSchema), create);
router.patch("/:id/cancel", cancel);
router.patch("/:id/complete", authorize("FACULTY", "ADMIN"), complete);

export default router;
