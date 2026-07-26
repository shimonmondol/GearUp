import { Router } from 'express';
import { createCategory, getCategories } from '../controllers/category.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getCategories);
router.post('/', protect, restrictTo('admin'), createCategory); // শুধুমাত্র অ্যাডমিন তৈরি করতে পারবে

export default router;