import { Router } from "express";
import authRoutes from "./auth";
import equipmentRoutes from "./equipment";
import bookingRoutes from "./bookings";
import facultyRoutes from "./faculty";
import aiRoutes from "./ai";
import analyticsRoutes from "./analytics";
import adminRoutes from "./admin";
import departmentRoutes from "./departments";

const router = Router();

router.use("/auth", authRoutes);
router.use("/equipment", equipmentRoutes);
router.use("/bookings", bookingRoutes);
router.use("/faculty", facultyRoutes);
router.use("/ai", aiRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/admin", adminRoutes);
router.use("/departments", departmentRoutes);

export default router;
