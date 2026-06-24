import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/helpers';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal server error';
  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    console.error(err);
  }
  res.status(statusCode).json({ success: false, message });
};

export const notFound = (_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError('Route not found', 404));
};
