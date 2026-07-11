import { z } from 'zod';

export const createGearSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }),
    description: z.string({ required_error: 'Description is required' }),
    brand: z.string({ required_error: 'Brand is required' }),
    pricePerDay: z.number({ required_error: 'Price per day must be a number' }).positive(),
    stock: z.number().int().nonnegative().optional(),
    categoryId: z.string({ required_error: 'Category ID is required' }).uuid(),
  }),
});