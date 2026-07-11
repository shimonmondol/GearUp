import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['customer', 'provider', 'admin'])
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const gearSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  brand: z.string().min(1),
  pricePerDay: z.number().positive(),
  stockQuantity: z.number().int().nonnegative(),
  categoryId: z.string().uuid()
});

export const rentalSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  gearItems: z.array(z.object({
    gearId: z.string().uuid(),
    quantity: z.number().int().positive()
  })).min(1)
});