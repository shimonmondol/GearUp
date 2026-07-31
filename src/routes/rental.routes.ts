import { Router } from "express";
import {
  createRentalOrder,
  getMyRentalOrders,
  getRentalOrderById,
  updateOrderStatus,
  getAllRentalOrders,
} from "../controllers/rental.controller";
import { protect, restrictTo } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

router.post("/", protect, createRentalOrder);
router.get("/", protect, getMyRentalOrders);
router.get("/admin/all", protect, restrictTo(Role.admin), getAllRentalOrders);
router.get("/:id", protect, getRentalOrderById);
router.patch("/:id/status", protect, restrictTo(Role.admin), updateOrderStatus);

export default router;