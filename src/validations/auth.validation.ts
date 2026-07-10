import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
    role: z.enum(['customer', 'provider', 'admin'], {
      message: 'Role must be customer, provider or admin',
    }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});