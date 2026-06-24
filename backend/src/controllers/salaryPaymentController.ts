import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../utils/helpers';

export const getSalaryPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, employeeId, month, year } = req.query as {
    page?: string; limit?: string; employeeId?: string; month?: string; year?: string;
  };
  const skip = (Number(page) - 1) * Number(limit);
  const where: { employeeId?: number; paymentMonth?: number; paymentYear?: number } = {};
  if (employeeId) where.employeeId = Number(employeeId);
  if (month) where.paymentMonth = Number(month);
  if (year) where.paymentYear = Number(year);

  const [data, total] = await Promise.all([
    prisma.salaryPayment.findMany({
      where, skip, take: Number(limit), orderBy: { paymentDate: 'desc' },
      include: { employee: true },
    }),
    prisma.salaryPayment.count({ where }),
  ]);
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
});

export const getSalaryPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const payment = await prisma.salaryPayment.findUnique({
    where: { salaryPaymentId: Number(req.params.id) },
    include: { employee: true },
  });
  if (!payment) throw new AppError('Salary payment not found', 404);
  res.json({ success: true, data: payment });
});

export const createSalaryPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { employeeId, amount, paymentMonth, paymentYear } = req.body;
  const employee = await prisma.employee.findUnique({ where: { employeeId } });
  if (!employee) throw new AppError('Employee not found', 404);
  if (employee.status === 'INACTIVE') throw new AppError('Cannot pay inactive employee', 400);

  const existing = await prisma.salaryPayment.findUnique({
    where: { employeeId_paymentMonth_paymentYear: { employeeId, paymentMonth, paymentYear } },
  });
  if (existing) throw new AppError('Salary already paid for this month', 409);

  const payment = await prisma.salaryPayment.create({
    data: { employeeId, amount, paymentMonth, paymentYear },
    include: { employee: true },
  });
  res.status(201).json({ success: true, data: payment });
});

export const getEmployeeSalaryHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const employeeId = Number(req.params.employeeId);
  const payments = await prisma.salaryPayment.findMany({
    where: { employeeId },
    orderBy: [{ paymentYear: 'desc' }, { paymentMonth: 'desc' }],
  });
  res.json({ success: true, data: payments });
});

export const deleteSalaryPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.salaryPayment.delete({ where: { salaryPaymentId: Number(req.params.id) } });
  res.json({ success: true, message: 'Salary payment deleted' });
});
