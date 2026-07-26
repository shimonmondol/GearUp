import { Router } from 'express';
import authRoutes from './auth.routes';
import gearRoutes from './gear.routes';
import rentalRoutes from './rental.routes';
import paymentRoutes from './payment.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/gear', gearRoutes);
router.use('/rentals', rentalRoutes);
router.use('/payments', paymentRoutes); 

export default router;