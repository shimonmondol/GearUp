import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.ts';
import * as gearService from '../services/gear.service.ts';
import { AppError } from '../utils/AppError.ts';

export const addGear = catchAsync(async (req: Request, res: Response) => {
  // req.user.id আসছে protect মিডলওয়্যার থেকে
  if (!req.user) throw new AppError('Authentication required', 401);
  
  const gear = await gearService.createGear(req.body, req.user.id);
  res.status(201).json({ status: 'success', data: { gear } });
});

export const getGears = catchAsync(async (req: Request, res: Response) => {
  const gears = await gearService.getAllGearItems(req.query);
  res.status(200).json({ status: 'success', results: gears.length, data: { gears } });
});

export const getGearDetails = catchAsync(async (req: Request, res: Response) => {
  const gear = await gearService.getGearItemById(req.params.id);
  if (!gear) throw new AppError('No gear item found with that ID', 404);
  
  res.status(200).json({ status: 'success', data: { gear } });
});