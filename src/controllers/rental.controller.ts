import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27' as any,
});

export const createRentalOrder = async (req: Request, res: Response) => {
  const { startDate, endDate, gearItems } = req.body || {};
  const user = (req as any).user;

  if (!startDate || !endDate || !gearItems || gearItems.length === 0) {
    throw new AppError(400, 'Missing required fields for rental order');
  }

  let total = 0;
  const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));

  if (days <= 0) throw new AppError(400, 'End date must be after start date');

  for (const item of gearItems) {
    const gear = await prisma.gearItem.findUnique({ where: { id: item.gearId } });
    if (!gear || gear.stockQuantity < item.quantity) {
      throw new AppError(400, `Item ${gear?.title || 'Unknown'} is out of stock`);
    }
    total += gear.pricePerDay * item.quantity * days;
  }

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.rentalOrder.create({
      data: {
        customerId: user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalPrice: total,
        status: 'PLACED'
      }
    });

    for (const item of gearItems) {
      await tx.orderItem.create({
        data: { orderId: newOrder.id, gearId: item.gearId, quantity: item.quantity }
      });
      await tx.gearItem.update({
        where: { id: item.gearId },
        data: { stockQuantity: { decrement: item.quantity } }
      });
    }
    return newOrder;
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: `GearUp Rental Order #${order.id}` },
        unit_amount: Math.round(total * 100), // সেন্ট-এ কনভার্ট করা
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `http://localhost:5000/api/payments/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `http://localhost:5000/api/payments/cancel`,
    client_reference_id: order.id
  });

  res.status(201).json({
    success: true,
    message: 'Order placed successfully. Complete payment via link.',
    checkoutUrl: session.url,
    orderId: order.id
  });
};