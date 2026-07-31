import { Request, Response } from "express";
import prisma from "../config/prisma";

export const getAllUsers = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      isActive: true,
      createdAt: true,
    },
  });

  res.json({
    success: true,
    message: "All users retrieved successfully!",
    data: users,
  });
};