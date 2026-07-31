import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';

// 1. Create Category
export const createCategory = async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name || typeof name !== 'string') {
    throw new AppError(400, "Category name is required");
  }

  const slug = name.trim().toLowerCase().replace(/\s+/g, '-');

  const existingCategory = await prisma.category.findUnique({
    where: { name: name.trim() },
  });

  if (existingCategory) {
    throw new AppError(400, "Category already exists");
  }

  const newCategory = await prisma.category.create({
    data: { 
      name: name.trim(), 
      slug 
    },
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: newCategory,
  });
};

// 2. Get All Categories
export const getCategories = async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  res.status(200).json({
    success: true,
    data: categories,
  });
};

// 3. Delete Category by ID
export const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const category = await prisma.category.findUnique({
    where: { id: String(id) },
    include: {
      gearItems: true,
    },
  });

  if (!category) {
    throw new AppError(404, "Category not found");
  }
  if (category.gearItems && category.gearItems.length > 0) {
    throw new AppError(
      400,
      `Cannot delete category. There are ${category.gearItems.length} gear item(s) linked to this category.`
    );
  }

  await prisma.category.delete({
    where: { id: String(id) },
  });

  res.status(200).json({
    success: true,
    message: "Category deleted successfully!",
  });
};