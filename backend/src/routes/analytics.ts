import { Router } from "express";
import { dashboard, utilisation } from "../controllers/analyticsController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/dashboard", dashboard);
router.get("/utilisation", authorize("FACULTY", "ADMIN"), utilisation);

export default router;
