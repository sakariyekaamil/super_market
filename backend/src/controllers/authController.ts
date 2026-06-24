import { Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../utils/helpers';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';

const sanitizeUser = (user: { password: string; refreshToken: string | null; [key: string]: unknown }) => {
  const { password, refreshToken, ...rest } = user;
  return rest;
};

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Invalid username or password', 401);
  }
  const payload = { userId: user.userId, username: user.username, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await prisma.user.update({ where: { userId: user.userId }, data: { refreshToken } });
  res.json({ success: true, data: { user: sanitizeUser(user), accessToken, refreshToken } });
});

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { fullName, username, password, role } = req.body;
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) throw new AppError('Username already exists', 409);
  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { fullName, username, password: hashed, role },
  });
  res.status(201).json({ success: true, data: sanitizeUser(user) });
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { userId: req.user!.userId } });
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, data: sanitizeUser(user) });
});

export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken: token } = req.body;
  if (!token) throw new AppError('Refresh token required', 400);
  const payload = verifyRefreshToken(token);
  const user = await prisma.user.findUnique({ where: { userId: payload.userId } });
  if (!user || user.refreshToken !== token) throw new AppError('Invalid refresh token', 401);
  const newPayload = { userId: user.userId, username: user.username, role: user.role };
  const accessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);
  await prisma.user.update({ where: { userId: user.userId }, data: { refreshToken: newRefreshToken } });
  res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.user.update({
    where: { userId: req.user!.userId },
    data: { refreshToken: null },
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { userId: req.user!.userId } });
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    throw new AppError('Current password is incorrect', 400);
  }
  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { userId: user.userId }, data: { password: hashed } });
  res.json({ success: true, message: 'Password changed successfully' });
});

export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, search = '' } = req.query as { page?: string; limit?: string; search?: string };
  const skip = (Number(page) - 1) * Number(limit);
  const where = search
    ? { OR: [{ fullName: { contains: search, mode: 'insensitive' as const } }, { username: { contains: search, mode: 'insensitive' as const } }] }
    : {};
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, select: { userId: true, fullName: true, username: true, role: true, createdAt: true } }),
    prisma.user.count({ where }),
  ]);
  res.json({ success: true, data: users, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
});

export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = Number(req.params.id);
  if (userId === req.user!.userId && req.body.role) {
    throw new AppError('Cannot change your own role', 400);
  }
  const user = await prisma.user.update({
    where: { userId },
    data: req.body,
    select: { userId: true, fullName: true, username: true, role: true, createdAt: true },
  });
  res.json({ success: true, data: user });
});

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = Number(req.params.id);
  if (userId === req.user!.userId) throw new AppError('Cannot delete your own account', 400);
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  const target = await prisma.user.findUnique({ where: { userId } });
  if (!target) throw new AppError('User not found', 404);
  if (target.role === 'ADMIN' && adminCount <= 1) {
    throw new AppError('Cannot delete the last admin user', 400);
  }
  await prisma.user.delete({ where: { userId } });
  res.json({ success: true, message: 'User deleted' });
});
