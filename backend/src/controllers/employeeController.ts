import { Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../utils/helpers';

export const getEmployees = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, search = '' } = req.query as { page?: string; limit?: string; search?: string };
  const skip = (Number(page) - 1) * Number(limit);
  const where: Prisma.EmployeeWhereInput = search
    ? { OR: [{ fullName: { contains: search, mode: 'insensitive' } }, { position: { contains: search, mode: 'insensitive' } }] }
    : {};
  const [data, total] = await Promise.all([
    prisma.employee.findMany({ where, skip, take: Number(limit), orderBy: { fullName: 'asc' } }),
    prisma.employee.count({ where }),
  ]);
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
});

export const getEmployee = asyncHandler(async (req: AuthRequest, res: Response) => {
  const employee = await prisma.employee.findUnique({ where: { employeeId: Number(req.params.id) } });
  if (!employee) throw new AppError('Employee not found', 404);
  res.json({ success: true, data: employee });
});

export const createEmployee = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { hireDate, ...rest } = req.body;
  const employee = await prisma.employee.create({
    data: { ...rest, hireDate: hireDate ? new Date(hireDate) : new Date() },
  });
  res.status(201).json({ success: true, data: employee });
});

export const updateEmployee = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { hireDate, ...rest } = req.body;
  const data = hireDate ? { ...rest, hireDate: new Date(hireDate) } : rest;
  const employee = await prisma.employee.update({ where: { employeeId: Number(req.params.id) }, data });
  res.json({ success: true, data: employee });
});

export const deactivateEmployee = asyncHandler(async (req: AuthRequest, res: Response) => {
  const employee = await prisma.employee.update({
    where: { employeeId: Number(req.params.id) },
    data: { status: 'INACTIVE' },
  });
  res.json({ success: true, data: employee });
});

export const deleteEmployee = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.employee.delete({ where: { employeeId: Number(req.params.id) } });
  res.json({ success: true, message: 'Employee deleted' });
});
