import { Router } from "express";
import { getAllUsers } from "../controllers/user.controller";
import { protect, restrictTo } from "../middlewares/auth.middleware";

const router = Router();

// GET /api/users
router.get("/", protect, restrictTo("admin"), getAllUsers);

export default router;