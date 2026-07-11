import { Request, Response } from "express";
import prisma from "../config/prisma.ts";
import { gearSchema } from "../validations/auth.validation.ts";
import { AppError } from "../utils/AppError";

export const getGears = async (req: Request, res: Response) => {
  const { category, brand, minPrice, maxPrice } = req.query;

  const gears = await prisma.gearItem.findMany({
    where: {
      isAvailable: true,
      brand: brand ? String(brand) : undefined,
      ...(category && { category: { name: String(category) } }),
      ...((minPrice || maxPrice) && {
        pricePerDay: {
          gte: minPrice ? Number(minPrice) : undefined,
          lte: maxPrice ? Number(maxPrice) : undefined,
        },
      }),
    },
    include: { category: true },
  });

  res.json({ success: true, data: gears });
};

export const createGear = async (req: Request, res: Response) => {
  const validatedData = gearSchema.parse(req.body || {});
  const user = (req as any).user;

  const gear = await prisma.gearItem.create({
    data: { ...validatedData, providerId: user.id },
  });

  res.status(201).json({ success: true, data: gear });
};

export const updateGear = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  const gear = await prisma.gearItem.findUnique({
    where: {
      id: String(id),
    },
  });
  if (!gear) throw new AppError(404, "Gear item not found");
  if (gear.providerId !== user.id) throw new AppError(403, "Unauthorized");

  const updated = await prisma.gearItem.update({
    where: {
      id: String(id),
    },
    data: req.body,
  });

  res.json({ success: true, data: updated });
};

export const deleteGear = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  const gear = await prisma.gearItem.findUnique({
    where: {
      id: String(id),
    },
  });
  if (!gear) throw new AppError(404, "Gear item not found");
  if (gear.providerId !== user.id) throw new AppError(403, "Unauthorized");

  await prisma.gearItem.delete({
    where: {
      id: String(id),
    },
  });
  res.json({ success: true, message: "Gear removed successfully" });
};
