import { Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../utils/helpers';

const LOW_STOCK = Number(process.env.LOW_STOCK_THRESHOLD) || 10;

export const getProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, search = '', categoryId, barcode, lowStock } = req.query as {
    page?: string; limit?: string; search?: string; categoryId?: string; barcode?: string; lowStock?: string;
  };
  const skip = (Number(page) - 1) * Number(limit);
  const where: Prisma.ProductWhereInput = {};
  if (search) {
    where.OR = [
      { productName: { contains: search, mode: 'insensitive' } },
      { barcode: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (categoryId) where.categoryId = Number(categoryId);
  if (barcode) where.barcode = barcode;
  if (lowStock === 'true') where.quantity = { lte: LOW_STOCK };

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where, skip, take: Number(limit), orderBy: { productName: 'asc' },
      include: { category: true, supplier: true },
    }),
    prisma.product.count({ where }),
  ]);
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
});

export const getProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { productId: Number(req.params.id) },
    include: { category: true, supplier: true },
  });
  if (!product) throw new AppError('Product not found', 404);
  res.json({ success: true, data: product });
});

export const getProductByBarcode = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { barcode: req.params.barcode },
    include: { category: true, supplier: true },
  });
  if (!product) throw new AppError('Product not found', 404);
  res.json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.body.barcode) {
    const dup = await prisma.product.findUnique({ where: { barcode: req.body.barcode } });
    if (dup) throw new AppError('Barcode already exists', 409);
  }
  const product = await prisma.product.create({
    data: req.body,
    include: { category: true, supplier: true },
  });
  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await prisma.product.update({
    where: { productId: Number(req.params.id) },
    data: req.body,
    include: { category: true, supplier: true },
  });
  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.product.delete({ where: { productId: Number(req.params.id) } });
  res.json({ success: true, message: 'Product deleted' });
});

export const getLowStockProducts = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const data = await prisma.product.findMany({
    where: { quantity: { lte: LOW_STOCK } },
    include: { category: true, supplier: true },
    orderBy: { quantity: 'asc' },
  });
  res.json({ success: true, data });
});
