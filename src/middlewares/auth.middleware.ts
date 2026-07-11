import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/CatchAsync.js';
import prisma from '../config/prisma.js';

interface JwtPayload {
  id: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
}

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // 1) Checking if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('You are not logged in! Please log in to get access.', 401);
  }

  // 2) Verification of token
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as JwtPayload;

  // 3) Check if user still exists
  const currentUser = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!currentUser) {
    throw new AppError('The user belonging to this token no longer exists.', 401);
  }

  if (!currentUser.isActive) {
    throw new AppError('This user account has been suspended.', 403);
  }

  // 4) Grant access to protected route
  req.user = {
    id: currentUser.id,
    role: currentUser.role,
  };
  
  next();
});