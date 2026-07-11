import { Router } from 'express';
import authRoutes from './auth.routes';
import gearRoutes from './gear.routes';
import { createRentalOrder } from '../controllers/rental.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

router.use('/auth', authRoutes);
router.use('/gear', gearRoutes);
router.post('/rentals', protect, restrictTo('customer'), createRentalOrder);

export default router;