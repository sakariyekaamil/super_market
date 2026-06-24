import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../utils/helpers';

export const getSales = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10 } = req.query as { page?: string; limit?: string };
  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    prisma.sale.findMany({
      skip, take: Number(limit), orderBy: { saleDate: 'desc' },
      include: {
        customer: true,
        user: { select: { fullName: true } },
        items: { include: { product: true } },
        payment: true,
      },
    }),
    prisma.sale.count(),
  ]);
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
});

export const getSale = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sale = await prisma.sale.findUnique({
    where: { saleId: Number(req.params.id) },
    include: {
      customer: true,
      user: { select: { fullName: true } },
      items: { include: { product: true } },
      payment: true,
    },
  });
  if (!sale) throw new AppError('Sale not found', 404);
  res.json({ success: true, data: sale });
});

export const createSale = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { customerId, items } = req.body;

  const sale = await prisma.$transaction(async (tx) => {
    const saleItems: { productId: number; quantity: number; unitPrice: number; subTotal: number }[] = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await tx.product.findUnique({ where: { productId: item.productId } });
      if (!product) throw new AppError(`Product ${item.productId} not found`, 404);
      if (product.quantity < item.quantity) {
        throw new AppError(`Insufficient stock for ${product.productName}. Available: ${product.quantity}`, 400);
      }
      const unitPrice = Number(product.sellingPrice);
      const subTotal = unitPrice * item.quantity;
      totalAmount += subTotal;
      saleItems.push({ productId: item.productId, quantity: item.quantity, unitPrice, subTotal });
    }

    const created = await tx.sale.create({
      data: {
        customerId: customerId || null,
        userId: req.user!.userId,
        totalAmount,
        items: { create: saleItems },
      },
    });

    for (const item of items) {
      await tx.product.update({
        where: { productId: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
    }
    return created;
  }, { timeout: 15000 });

  const full = await prisma.sale.findUnique({
    where: { saleId: sale.saleId },
    include: { customer: true, items: { include: { product: true } }, user: { select: { fullName: true } } },
  });
  res.status(201).json({ success: true, data: full });
});

export const deleteSale = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sale = await prisma.sale.findUnique({
    where: { saleId: Number(req.params.id) },
    include: { items: true, payment: true },
  });
  if (!sale) throw new AppError('Sale not found', 404);
  if (sale.payment) throw new AppError('Cannot delete sale with recorded payment', 400);

  await prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      await tx.product.update({
        where: { productId: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
    }
    await tx.sale.delete({ where: { saleId: sale.saleId } });
  }, { timeout: 15000 });
  res.json({ success: true, message: 'Sale deleted' });
});

export const getReceipt = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sale = await prisma.sale.findUnique({
    where: { saleId: Number(req.params.id) },
    include: {
      customer: true,
      user: { select: { fullName: true } },
      items: { include: { product: true } },
      payment: true,
    },
  });
  if (!sale) throw new AppError('Sale not found', 404);
  res.json({
    success: true,
    data: {
      receipt: {
        storeName: 'Alraxma Supermarket',
        saleId: sale.saleId,
        date: sale.saleDate,
        cashier: sale.user.fullName,
        customer: sale.customer?.fullName || 'Walk-in Customer',
        items: sale.items.map((i) => ({
          name: i.product.productName,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          subTotal: Number(i.subTotal),
        })),
        total: Number(sale.totalAmount),
        payment: sale.payment
          ? {
              method: sale.payment.paymentMethod,
              paid: Number(sale.payment.paidAmount),
              discount: Number(sale.payment.discount),
              change: Number(sale.payment.changeAmount),
            }
          : null,
      },
    },
  });
});
