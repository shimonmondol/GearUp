import { Request, Response } from 'express';
import { catchAsync } from '../utils/CatchAsync.js';
import * as authService from '../services/auth.service.js';

export const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json({ status: 'success', data: result });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);
  res.status(200).json({ status: 'success', data: result });
});