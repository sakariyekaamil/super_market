import { Response } from 'express';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, toNumber } from '../utils/helpers';

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const dailySalesReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const date = req.query.date ? new Date(String(req.query.date)) : new Date();
  const sales = await prisma.sale.findMany({
    where: { saleDate: { gte: startOfDay(date), lte: endOfDay(date) } },
    include: { customer: true, items: { include: { product: true } }, payment: true },
    orderBy: { saleDate: 'asc' },
  });
  const total = sales.reduce((s, sale) => s + toNumber(sale.totalAmount), 0);
  res.json({ success: true, data: { date, sales, total, count: sales.length } });
});

export const monthlySalesReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  const sales = await prisma.sale.findMany({
    where: { saleDate: { gte: start, lte: end } },
    include: { customer: true, items: { include: { product: true } }, payment: true },
    orderBy: { saleDate: 'asc' },
  });
  const total = sales.reduce((s, sale) => s + toNumber(sale.totalAmount), 0);
  res.json({ success: true, data: { month, year, sales, total, count: sales.length } });
});

export const revenueReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const payments = await prisma.payment.findMany({
    where: { paymentDate: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } },
    include: { sale: { include: { customer: true } } },
    orderBy: { paymentDate: 'asc' },
  });
  const total = payments.reduce((s, p) => s + toNumber(p.totalAmount), 0);
  const byMethod = payments.reduce((acc: Record<string, number>, p) => {
    acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + toNumber(p.totalAmount);
    return acc;
  }, {});
  res.json({ success: true, data: { year, payments, total, byMethod } });
});

export const purchaseReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const purchases = await prisma.purchase.findMany({
    where: { purchaseDate: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } },
    include: { supplier: true, details: { include: { product: true } } },
    orderBy: { purchaseDate: 'asc' },
  });
  const total = purchases.reduce((s, p) => s + toNumber(p.totalAmount), 0);
  res.json({ success: true, data: { year, purchases, total, count: purchases.length } });
});

export const inventoryReport = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const products = await prisma.product.findMany({
    include: { category: true, supplier: true },
    orderBy: { productName: 'asc' },
  });
  const totalValue = products.reduce((s, p) => s + toNumber(p.buyingPrice) * p.quantity, 0);
  res.json({ success: true, data: { products, totalValue, count: products.length } });
});

export const profitReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const sales = await prisma.sale.findMany({
    where: { saleDate: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } },
    include: { items: { include: { product: true } } },
  });
  let revenue = 0;
  let cost = 0;
  for (const sale of sales) {
    for (const item of sale.items) {
      revenue += toNumber(item.subTotal);
      cost += toNumber(item.product.buyingPrice) * item.quantity;
    }
  }
  res.json({ success: true, data: { year, revenue, cost, profit: revenue - cost } });
});

export const salaryReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const payments = await prisma.salaryPayment.findMany({
    where: { paymentMonth: month, paymentYear: year },
    include: { employee: true },
  });
  const total = payments.reduce((s, p) => s + toNumber(p.amount), 0);
  res.json({ success: true, data: { month, year, payments, total } });
});

const sendPdf = (res: Response, title: string, rows: string[][]) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s/g, '_')}.pdf"`);
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  doc.fontSize(18).text(title, { align: 'center' });
  doc.moveDown();
  doc.fontSize(10);
  rows.forEach((row) => doc.text(row.join(' | ')));
  doc.end();
};

const sendExcel = async (res: Response, title: string, headers: string[], rows: (string | number)[][]) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title);
  sheet.addRow(headers);
  rows.forEach((row) => sheet.addRow(row));
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s/g, '_')}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
};

export const exportReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, format } = req.query as { type: string; format: string };
  const year = Number(req.query.year) || new Date().getFullYear();

  if (type === 'inventory') {
    const products = await prisma.product.findMany({ include: { category: true } });
    const headers = ['Product', 'Category', 'Qty', 'Buy Price', 'Sell Price'];
    const rows = products.map((p) => [
      p.productName,
      p.category.categoryName,
      p.quantity,
      toNumber(p.buyingPrice),
      toNumber(p.sellingPrice),
    ]);
    if (format === 'excel') return sendExcel(res, 'Inventory Report', headers, rows);
    return sendPdf(res, 'Inventory Report', [headers, ...rows.map((r) => r.map(String))]);
  }

  if (type === 'sales') {
    const sales = await prisma.sale.findMany({
      where: { saleDate: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } },
      include: { customer: true },
    });
    const headers = ['Sale ID', 'Date', 'Customer', 'Total'];
    const rows = sales.map((s) => [
      s.saleId,
      s.saleDate.toISOString().split('T')[0],
      s.customer?.fullName || 'Walk-in',
      toNumber(s.totalAmount),
    ]);
    if (format === 'excel') return sendExcel(res, 'Sales Report', headers, rows);
    return sendPdf(res, 'Sales Report', [headers, ...rows.map((r) => r.map(String))]);
  }

  if (type === 'profit') {
    const sales = await prisma.sale.findMany({
      where: { saleDate: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } },
      include: { items: { include: { product: true } } },
    });
    let revenue = 0;
    let cost = 0;
    for (const sale of sales) {
      for (const item of sale.items) {
        revenue += toNumber(item.subTotal);
        cost += toNumber(item.product.buyingPrice) * item.quantity;
      }
    }
    const rows = [['Revenue', revenue], ['Cost', cost], ['Profit', revenue - cost]];
    if (format === 'excel') return sendExcel(res, 'Profit Report', ['Metric', 'Amount'], rows);
    return sendPdf(res, 'Profit Report', rows.map((r) => r.map(String)));
  }

  res.status(400).json({ success: false, message: 'Invalid report type. Use: inventory, sales, profit' });
});
