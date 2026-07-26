import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const createCategory = async (req: Request, res: Response) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, message: "Category name is required" });
  }

  const slug = name.toLowerCase().replace(/ /g, '-');
  
  const db: any = prisma;
  const categoryModel = db.category || db.Category;

  const newCategory = await categoryModel.create({
    data: { name, slug }
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: newCategory
  });
};

export const getCategories = async (req: Request, res: Response) => {
  const db: any = prisma;
  const categoryModel = db.category || db.Category;
  
  const categories = await categoryModel.findMany();
  res.status(200).json({
    success: true,
    data: categories
  });
};