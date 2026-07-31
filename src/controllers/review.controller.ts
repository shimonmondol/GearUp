import { Request, Response } from "express";
import { OrderStatus } from "@prisma/client";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";

// 1. Create Review (Only after rental return)
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
      status: OrderStatus.RETURNED,
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

// 2. Get All Reviews for a Specific Gear Item
export const getGearReviews = async (req: Request, res: Response) => {
  const { gearId } = req.params;

  const reviews = await prisma.review.findMany({
    where: { gearId: String(gearId) },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    success: true,
    message: "Reviews fetched successfully",
    data: reviews,
  });
};

// 3. Delete a Review (Only Author or Admin)
export const deleteReview = async (req: Request, res: Response) => {
  const { id } = req.params; // Review ID
  const user = (req as any).user;

  // 1. Review ডাটাবেজে আছে কি না চেক
  const existingReview = await prisma.review.findUnique({
    where: { id: String(id) },
  });

  if (!existingReview) {
    throw new AppError(404, "Review not found");
  }

  // 2. Authorization Check (যে রিভিউ দিয়েছে অথবা অ্যাডমিন ডিলিট করতে পারবে)
  const isAdmin = user.role === "admin" || user.role === "ADMIN";
  if (existingReview.userId !== user.id && !isAdmin) {
    throw new AppError(403, "You are not authorized to delete this review");
  }

  // 3. Delete Review Record
  await prisma.review.delete({
    where: { id: String(id) },
  });

  res.status(200).json({
    success: true,
    message: "Review deleted successfully!",
  });
};