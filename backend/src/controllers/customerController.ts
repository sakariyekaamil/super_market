import { Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../utils/helpers';

export const getCustomers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, search = '' } = req.query as { page?: string; limit?: string; search?: string };
  const skip = (Number(page) - 1) * Number(limit);
  const where: Prisma.CustomerWhereInput = search
    ? { OR: [{ fullName: { contains: search, mode: 'insensitive' } }, { phone: { contains: search, mode: 'insensitive' } }] }
    : {};
  const [data, total] = await Promise.all([
    prisma.customer.findMany({ where, skip, take: Number(limit), orderBy: { fullName: 'asc' } }),
    prisma.customer.count({ where }),
  ]);
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
});

export const getCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const customer = await prisma.customer.findUnique({ where: { customerId: Number(req.params.id) } });
  if (!customer) throw new AppError('Customer not found', 404);
  res.json({ success: true, data: customer });
});

export const getCustomerHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const customerId = Number(req.params.id);
  const customer = await prisma.customer.findUnique({ where: { customerId } });
  if (!customer) throw new AppError('Customer not found', 404);
  const sales = await prisma.sale.findMany({
    where: { customerId },
    include: { items: { include: { product: true } }, payment: true, user: { select: { fullName: true } } },
    orderBy: { saleDate: 'desc' },
  });
  res.json({ success: true, data: { customer, sales } });
});

export const createCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const customer = await prisma.customer.create({ data: req.body });
  res.status(201).json({ success: true, data: customer });
});

export const updateCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const customer = await prisma.customer.update({ where: { customerId: Number(req.params.id) }, data: req.body });
  res.json({ success: true, data: customer });
});

export const deleteCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.customer.delete({ where: { customerId: Number(req.params.id) } });
  res.json({ success: true, message: 'Customer deleted' });
});
