import { z } from 'zod';

export const createGearSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    brand: z.string().min(1, 'Brand is required'),
    pricePerDay: z.number({ message: 'Price per day must be a number' }).positive(),
    stock: z.number().int().nonnegative().optional(),
    categoryId: z.string().min(1, 'Category ID is required').uuid('Invalid UUID format'),
  }),
});