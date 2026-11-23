import { Router } from "express";
import rateLimit from "express-rate-limit";
import { recommend, resolve } from "../controllers/aiController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { aiRecommendSchema, resolveConflictsSchema } from "../validators";

const router = Router();

router.use(authenticate);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: { message: "AI request limit reached. Please wait a moment.", code: "RATE_LIMITED" },
    });
  },
});

router.post("/recommend-equipment", aiLimiter, validate(aiRecommendSchema), recommend);
router.post(
  "/resolve-conflicts",
  authorize("FACULTY", "ADMIN"),
  validate(resolveConflictsSchema),
  resolve
);

export default router;
