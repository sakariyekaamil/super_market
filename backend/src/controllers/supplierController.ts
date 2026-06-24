import { Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../utils/helpers';

export const getSuppliers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, search = '' } = req.query as { page?: string; limit?: string; search?: string };
  const skip = (Number(page) - 1) * Number(limit);
  const where: Prisma.SupplierWhereInput = search
    ? { OR: [{ supplierName: { contains: search, mode: 'insensitive' } }, { phone: { contains: search, mode: 'insensitive' } }] }
    : {};
  const [data, total] = await Promise.all([
    prisma.supplier.findMany({ where, skip, take: Number(limit), orderBy: { supplierName: 'asc' } }),
    prisma.supplier.count({ where }),
  ]);
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
});

export const getSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
  const supplier = await prisma.supplier.findUnique({ where: { supplierId: Number(req.params.id) } });
  if (!supplier) throw new AppError('Supplier not found', 404);
  res.json({ success: true, data: supplier });
});

export const createSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
  const supplier = await prisma.supplier.create({ data: req.body });
  res.status(201).json({ success: true, data: supplier });
});

export const updateSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
  const supplier = await prisma.supplier.update({ where: { supplierId: Number(req.params.id) }, data: req.body });
  res.json({ success: true, data: supplier });
});

export const deleteSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
  const products = await prisma.product.count({ where: { supplierId: Number(req.params.id) } });
  if (products > 0) throw new AppError('Cannot delete supplier with associated products', 400);
  await prisma.supplier.delete({ where: { supplierId: Number(req.params.id) } });
  res.json({ success: true, message: 'Supplier deleted' });
});
