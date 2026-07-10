import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/AppError'

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong!';

  // Prisma Unique Constraint Error (e.g., Email already exists)
  if (err.code === 'P2002') {
    statusCode = 400;
    message = 'Duplicate field value entered.';
  }

  res.status(statusCode).json({
    status: err.status || 'error',
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};