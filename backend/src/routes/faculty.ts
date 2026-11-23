import { Router } from "express";
import { approve, reject, requests } from "../controllers/facultyController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { bookingQuerySchema, rejectSchema } from "../validators";

const router = Router();

router.use(authenticate, authorize("FACULTY", "ADMIN"));

router.get("/requests", validate(bookingQuerySchema, "query"), requests);
router.patch("/requests/:id/approve", approve);
router.patch("/requests/:id/reject", validate(rejectSchema), reject);

export default router;
