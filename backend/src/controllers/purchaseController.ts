import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../utils/helpers';

export const getPurchases = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10 } = req.query as { page?: string; limit?: string };
  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    prisma.purchase.findMany({
      skip, take: Number(limit), orderBy: { purchaseDate: 'desc' },
      include: { supplier: true, user: { select: { fullName: true } }, details: { include: { product: true } } },
    }),
    prisma.purchase.count(),
  ]);
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
});

export const getPurchase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const purchase = await prisma.purchase.findUnique({
    where: { purchaseId: Number(req.params.id) },
    include: { supplier: true, user: { select: { fullName: true } }, details: { include: { product: true } } },
  });
  if (!purchase) throw new AppError('Purchase not found', 404);
  res.json({ success: true, data: purchase });
});

export const createPurchase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { supplierId, items } = req.body;
  const totalAmount = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + item.quantity * item.unitPrice, 0);

  const purchase = await prisma.$transaction(async (tx) => {
    const created = await tx.purchase.create({
      data: {
        supplierId,
        userId: req.user!.userId,
        totalAmount,
        details: { create: items },
      },
      include: { details: true },
    });

    for (const item of items) {
      await tx.product.update({
        where: { productId: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
    }
    return created;
  }, { timeout: 15000 });

  const full = await prisma.purchase.findUnique({
    where: { purchaseId: purchase.purchaseId },
    include: { supplier: true, details: { include: { product: true } } },
  });
  res.status(201).json({ success: true, data: full });
});

export const deletePurchase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const purchase = await prisma.purchase.findUnique({
    where: { purchaseId: Number(req.params.id) },
    include: { details: true },
  });
  if (!purchase) throw new AppError('Purchase not found', 404);

  await prisma.$transaction(async (tx) => {
    for (const detail of purchase.details) {
      await tx.product.update({
        where: { productId: detail.productId },
        data: { quantity: { decrement: detail.quantity } },
      });
    }
    await tx.purchase.delete({ where: { purchaseId: purchase.purchaseId } });
  }, { timeout: 15000 });
  res.json({ success: true, message: 'Purchase deleted' });
});
