import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, me, register } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { loginSchema, registerSchema } from "../validators";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: { message: "Too many login attempts. Please try again later.", code: "RATE_LIMITED" },
    });
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: { message: "Too many accounts created from this address.", code: "RATE_LIMITED" },
    });
  },
});

router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/register", registerLimiter, validate(registerSchema), register);
router.get("/me", authenticate, me);

export default router;
