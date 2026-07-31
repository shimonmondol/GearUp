import { Router } from "express";
import { 
  createCategory, 
  getCategories, 
  deleteCategory 
} from "../controllers/category.controller";
import { protect, restrictTo } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", getCategories);
router.post("/", protect, restrictTo("admin"), createCategory);
router.delete("/:id", protect, restrictTo("admin"), deleteCategory);

export default router;