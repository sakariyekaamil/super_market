import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, toNumber } from '../utils/helpers';

const LOW_STOCK = Number(process.env.LOW_STOCK_THRESHOLD) || 10;

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getDashboardStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  const [
    totalProducts,
    totalCategories,
    totalSuppliers,
    totalCustomers,
    totalEmployees,
    salesToday,
    totalPurchases,
    lowStockProducts,
    revenueAgg,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.supplier.count(),
    prisma.customer.count(),
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
    prisma.sale.count({ where: { saleDate: { gte: todayStart, lte: todayEnd } } }),
    prisma.purchase.count(),
    prisma.product.count({ where: { quantity: { lte: LOW_STOCK } } }),
    prisma.payment.aggregate({ _sum: { totalAmount: true } }),
  ]);

  res.json({
    success: true,
    data: {
      totalProducts,
      totalCategories,
      totalSuppliers,
      totalCustomers,
      totalEmployees,
      totalSalesToday: salesToday,
      totalRevenue: toNumber(revenueAgg._sum.totalAmount) || 0,
      totalPurchases,
      lowStockProducts,
    },
  });
});

export const getMonthlySalesChart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const sales = await prisma.sale.findMany({
    where: { saleDate: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } },
    select: { saleDate: true, totalAmount: true },
  });

  const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, sales: 0, revenue: 0 }));
  for (const sale of sales) {
    const m = sale.saleDate.getMonth();
    monthly[m].sales += 1;
    monthly[m].revenue += toNumber(sale.totalAmount);
  }
  res.json({ success: true, data: monthly });
});

export const getTopSellingProducts = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const items = await prisma.saleItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 10,
  });

  const products = await prisma.product.findMany({
    where: { productId: { in: items.map((i) => i.productId) } },
  });
  const productMap = Object.fromEntries(products.map((p) => [p.productId, p.productName]));

  res.json({
    success: true,
    data: items.map((i) => ({
      productId: i.productId,
      productName: productMap[i.productId] || 'Unknown',
      totalSold: i._sum.quantity || 0,
    })),
  });
});

export const getPurchasesByMonth = asyncHandler(async (req: AuthRequest, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const purchases = await prisma.purchase.findMany({
    where: { purchaseDate: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } },
    select: { purchaseDate: true, totalAmount: true },
  });

  const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, purchases: 0, amount: 0 }));
  for (const p of purchases) {
    const m = p.purchaseDate.getMonth();
    monthly[m].purchases += 1;
    monthly[m].amount += toNumber(p.totalAmount);
  }
  res.json({ success: true, data: monthly });
});
