import { Router } from "express";
import {
  createReview,
  getGearReviews,
  deleteReview,
} from "../controllers/review.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

// 1. Create a new review (Protected)
router.post("/", protect, createReview);

// 2. Get all reviews for a specific gear (Public)
router.get("/gear/:gearId", getGearReviews);

// 3. Delete a review by ID (Protected - Author or Admin)
router.delete("/:id", protect, deleteReview);

export default router;