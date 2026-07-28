import { Router } from "express";
// 1. আপনার কন্ট্রোলার থেকে getGearById (বা getSingleGear) ইম্পোর্ট করুন
import {
  createGear,
  deleteGear,
  getGears,
  updateGear,
  getGearById,
} from "../controllers/gear.controller";
import { protect, restrictTo } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";

const router = Router();

// Category Routes
router.post("/categories", protect, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Category name is required" });
    }

    const slug = name.toLowerCase().trim().replace(/ +/g, "-");
    const db: any = prisma;
    const categoryModel = db.category || db.Category;

    const newCategory = await categoryModel.create({
      data: { name, slug },
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const db: any = prisma;
    const categoryModel = db.category || db.Category;
    const categories = await categoryModel.findMany();
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Gear CRUD Routes
router.get("/", getGears);
router.get("/:id", getGearById);
router.post("/", protect, restrictTo("provider"), createGear);
router.put("/:id", protect, restrictTo("provider"), updateGear);
router.delete("/:id", protect, restrictTo("provider"), deleteGear);

export default router;
