import { Router } from 'express';
import { createGear, deleteGear, getGears, updateGear } from '../controllers/gear.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

const router = Router();

router.get('/categories', async (req, res) => {
  const categories = await prisma.category.findMany();
  res.json({
    success: true,
    data: categories
  });
});

router.get('/', getGears);
router.post('/', protect, restrictTo('provider'), createGear);
router.put('/:id', protect, restrictTo('provider'), updateGear);
router.delete('/:id', protect, restrictTo('provider'), deleteGear);

export default router;