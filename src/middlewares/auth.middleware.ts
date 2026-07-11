import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/CatchAsync.js';
import prisma from '../config/prisma.js';
// 💡 ১. আপনার প্রিজমা ক্লায়েন্ট থেকে Role এনামটি ইম্পোর্ট করুন
import { Role } from '@prisma/client'; 

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role; // 💡 ২. এখানে সরাসরি Prisma-র Role ব্যবহার করুন
      };
    }
  }
}

interface JwtPayload {
  id: string;
  role: Role; // 💡 ৩. এখানেও Prisma-র Role ব্যবহার করুন
}

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError(401, 'You are not logged in! Please log in to get access.');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as JwtPayload;

  const currentUser = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!currentUser) {
    throw new AppError(401, 'The user belonging to this token no longer exists.');
  }

  if (!currentUser.isActive) {
    throw new AppError(403, 'This user account has been suspended.');
  }

  // 💡 ৪. এখন currentUser.role সরাসরি ম্যাচ করবে, কোনো টাইপ এরর দেবে না
  req.user = {
    id: currentUser.id,
    role: currentUser.role, 
  };
  
  next();
});