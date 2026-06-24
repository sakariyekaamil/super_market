import { Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../utils/helpers';

export const getCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, search = '' } = req.query as { page?: string; limit?: string; search?: string };
  const skip = (Number(page) - 1) * Number(limit);
  const where: Prisma.CategoryWhereInput = search
    ? { OR: [{ categoryName: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] }
    : {};
  const [data, total] = await Promise.all([
    prisma.category.findMany({ where, skip, take: Number(limit), orderBy: { categoryName: 'asc' } }),
    prisma.category.count({ where }),
  ]);
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
});

export const getCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await prisma.category.findUnique({ where: { categoryId: Number(req.params.id) } });
  if (!category) throw new AppError('Category not found', 404);
  res.json({ success: true, data: category });
});

export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await prisma.category.create({ data: req.body });
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await prisma.category.update({ where: { categoryId: Number(req.params.id) }, data: req.body });
  res.json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const products = await prisma.product.count({ where: { categoryId: Number(req.params.id) } });
  if (products > 0) throw new AppError('Cannot delete category with associated products', 400);
  await prisma.category.delete({ where: { categoryId: Number(req.params.id) } });
  res.json({ success: true, message: 'Category deleted' });
});
