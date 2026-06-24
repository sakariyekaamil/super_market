import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../utils/helpers';

export const getPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10 } = req.query as { page?: string; limit?: string };
  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      skip, take: Number(limit), orderBy: { paymentDate: 'desc' },
      include: { sale: { include: { customer: true, items: { include: { product: true } } } } },
    }),
    prisma.payment.count(),
  ]);
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
});

export const getPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const payment = await prisma.payment.findUnique({
    where: { paymentId: Number(req.params.id) },
    include: { sale: { include: { customer: true, items: { include: { product: true } } } } },
  });
  if (!payment) throw new AppError('Payment not found', 404);
  res.json({ success: true, data: payment });
});

export const createPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { saleId, paymentMethod, paidAmount, discount = 0 } = req.body;
  const sale = await prisma.sale.findUnique({ where: { saleId } });
  if (!sale) throw new AppError('Sale not found', 404);
  const existing = await prisma.payment.findUnique({ where: { saleId } });
  if (existing) throw new AppError('Payment already recorded for this sale', 400);

  const totalAmount = Number(sale.totalAmount) - discount;
  if (paidAmount < totalAmount) throw new AppError('Paid amount is less than total after discount', 400);
  const changeAmount = paidAmount - totalAmount;

  const payment = await prisma.payment.create({
    data: { saleId, paymentMethod, paidAmount, discount, totalAmount, changeAmount },
    include: { sale: { include: { customer: true, items: { include: { product: true } } } } },
  });
  res.status(201).json({ success: true, data: payment });
});

export const updatePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const paymentId = Number(req.params.id);
  const existing = await prisma.payment.findUnique({
    where: { paymentId },
    include: { sale: true },
  });
  if (!existing) throw new AppError('Payment not found', 404);

  const paymentMethod = req.body.paymentMethod ?? existing.paymentMethod;
  const discount = req.body.discount ?? Number(existing.discount);
  const paidAmount = req.body.paidAmount ?? Number(existing.paidAmount);
  const totalAmount = Number(existing.sale.totalAmount) - discount;

  if (paidAmount < totalAmount) throw new AppError('Paid amount is less than total after discount', 400);
  const changeAmount = paidAmount - totalAmount;

  const payment = await prisma.payment.update({
    where: { paymentId },
    data: { paymentMethod, paidAmount, discount, totalAmount, changeAmount },
    include: { sale: { include: { customer: true, items: { include: { product: true } } } } },
  });
  res.json({ success: true, data: payment });
});

export const deletePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.payment.delete({ where: { paymentId: Number(req.params.id) } });
  res.json({ success: true, message: 'Payment deleted' });
});
