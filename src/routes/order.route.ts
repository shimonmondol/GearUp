import { Router } from "express";
import { 
  getAllOrders, 
  createOrder, 
  getMyOrders,
  updateOrder,
  cancelOrder,
  deleteOrder 
} from "../controllers/order.controller";
import { protect, restrictTo } from "../middlewares/auth.middleware";

const router = Router();

// 1. All Orders List (Admin Only)
router.get("/", protect, restrictTo("admin"), getAllOrders); 

// 2. Customer's Own Orders List
router.get("/my-orders", protect, getMyOrders);

// 3. Create New Order
router.post("/", protect, createOrder);

// 4. Update Order Details or Status (Customer for pending dates / Admin for status)
router.patch("/:id", protect, updateOrder);

// 5. Cancel Order (Customer/Admin)
router.patch("/:id/cancel", protect, cancelOrder);

// 6. Delete Order Permanently (Admin Only or Protected User)
router.delete("/:id", protect, deleteOrder);

export default router;