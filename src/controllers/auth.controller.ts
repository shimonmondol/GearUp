import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.ts';
import { registerSchema, loginSchema } from '../validations/auth.validation';
import { AppError } from '../utils/AppError';

export const registerUser = async (req: Request, res: Response): Promise<any> => {
  const bodyData = req.body || {};
  const validatedData = registerSchema.parse(bodyData);
  const { name, email, password, role } = validatedData;

  const userExists = await prisma.user.findUnique({ where: { email } });
  if (userExists) {
    throw new AppError(400, 'User already exists with this email.');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role }
  });

  return res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
};

export const loginUser = async (req: Request, res: Response): Promise<any> => {
  const validatedData = loginSchema.parse(req.body || {});
  const { email, password } = validatedData;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(400, 'Invalid credentials');
  if (user.status === 'suspended') throw new AppError(403, 'Your account has been suspended');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError(400, 'Invalid credentials');

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1d' }
  );

  return res.json({
    success: true,
    message: 'Login successful',
    token,
    data: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
};