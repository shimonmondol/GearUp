import { Router } from "express";
import { createReview } from "../controllers/review.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();
router.post("/", protect, createReview);

export default router;