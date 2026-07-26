import { Router } from 'express';
import { createRentalOrder } from '../controllers/rental.controller'; // 👈 সঠিক নাম বসানো হলো
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', protect, createRentalOrder);

export default router;