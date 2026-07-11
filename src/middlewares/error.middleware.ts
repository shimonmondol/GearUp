import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorDetails = err.errorDetails || null;

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errorDetails = err.issues.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
  }

  if (err.code === 'P2002') {
    statusCode = 400;
    message = 'Duplicate field value entered';
    errorDetails = { target: err.meta?.target };
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorDetails
  });
};