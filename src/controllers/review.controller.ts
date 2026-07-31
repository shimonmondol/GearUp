import { Request, Response } from "express";
import { OrderStatus } from "@prisma/client";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";

// Create Review (Only after rental return)
export const createReview = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { gearId, rating, comment } = req.body;

  // 1. Basic Input Validation
  if (!gearId || !rating) {
    throw new AppError(400, "Gear ID and rating are required");
  }

  const numericRating = Number(rating);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new AppError(400, "Rating must be an integer between 1 and 5");
  }

  // 2. Check Gear Existence
  const gear = await prisma.gearItem.findUnique({
    where: { id: String(gearId) },
  });

  if (!gear) {
    throw new AppError(404, "Gear item not found");
  }

  // 3. Business Logic: Check if customer actually rented AND returned this gear
  const completedOrder = await prisma.rentalOrder.findFirst({
    where: {
      customerId: user.id,
      status: OrderStatus.RETURNED, // 👈 অথবা আপনার স্কিমা অনুযায়ী OrderStatus.COMPLETED
      orderItems: {
        some: {
          gearId: String(gearId),
        },
      },
    },
  });

  if (!completedOrder) {
    throw new AppError(
      403,
      "You can only review gear items after returning a completed rental"
    );
  }

  // 4. Duplicate Review Check
  const existingReview = await prisma.review.findUnique({
    where: {
      userId_gearId: {
        userId: user.id,
        gearId: String(gearId),
      },
    },
  });

  if (existingReview) {
    throw new AppError(400, "You have already reviewed this gear item");
  }

  // 5. Create Review Record
  const newReview = await prisma.review.create({
    data: {
      userId: user.id,
      gearId: String(gearId),
      rating: numericRating,
      comment: comment || null,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      gear: {
        select: { id: true, title: true },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: "Review submitted successfully!",
    data: newReview,
  });
};