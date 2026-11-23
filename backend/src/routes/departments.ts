import { Router } from "express";
import { list } from "../controllers/departmentController";

const router = Router();

router.get("/", list);

export default router;
