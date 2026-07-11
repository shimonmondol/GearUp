import { Request, Response } from 'express';
import { catchAsync } from '../utils/CatchAsync.ts';
import * as gearService from '../services/gear.service.ts';
import { AppError } from '../utils/AppError.ts';
import router from './auth.routes.ts';

export const addGear = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(401, 'Authentication required');
  
  const gear = await gearService.createGear(req.body, req.user.id);
  res.status(201).json({ status: 'success', data: { gear } });
});

export const getGears = catchAsync(async (req: Request, res: Response) => {
  const gears = await gearService.getAllGearItems(req.query);
  res.status(200).json({ status: 'success', results: gears.length, data: { gears } });
});

export const getGearDetails = catchAsync(async (req: Request<{ id: string }>, res: Response) => {
  const gear = await gearService.getGearItemById(req.params.id);
  
  if (!gear) throw new AppError(404, 'No gear item found with that ID');
  
  res.status(200).json({ status: 'success', data: { gear } });
});

export default router;