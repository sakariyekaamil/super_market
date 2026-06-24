import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import prisma from '../prisma/client';
import { AppError } from '../utils/helpers';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { userId: payload.userId } });
    if (!user) throw new AppError('User not found', 401);
    req.user = payload;
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Authentication required', 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
};

export const ROLE_PERMISSIONS = {
  products: [Role.ADMIN, Role.MANAGER],
  categories: [Role.ADMIN, Role.MANAGER],
  suppliers: [Role.ADMIN, Role.MANAGER],
  purchases: [Role.ADMIN, Role.MANAGER],
  reports: [Role.ADMIN, Role.MANAGER],
  employees: [Role.ADMIN],
  salaryPayments: [Role.ADMIN],
  sales: [Role.ADMIN, Role.MANAGER, Role.CASHIER],
  payments: [Role.ADMIN, Role.MANAGER, Role.CASHIER],
  customers: [Role.ADMIN, Role.MANAGER, Role.CASHIER],
  users: [Role.ADMIN],
  dashboard: [Role.ADMIN, Role.MANAGER, Role.CASHIER],
};
