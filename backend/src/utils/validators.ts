import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']).optional(),
});

export const updatePaymentSchema = z.object({
  paymentMethod: z.enum(['CASH', 'ZAAD', 'EDAHAB', 'CARD']).optional(),
  paidAmount: z.coerce.number().positive().optional(),
  discount: z.coerce.number().min(0).optional(),
});

export const categorySchema = z.object({
  categoryName: z.string().min(1),
  description: z.string().optional(),
});

export const supplierSchema = z.object({
  supplierName: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const productSchema = z.object({
  productName: z.string().min(1),
  categoryId: z.coerce.number().int().positive(),
  supplierId: z.coerce.number().int().positive(),
  barcode: z.string().optional(),
  buyingPrice: z.coerce.number().positive(),
  sellingPrice: z.coerce.number().positive(),
  quantity: z.coerce.number().int().min(0).optional(),
});

export const customerSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const purchaseItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().positive(),
});

export const purchaseSchema = z.object({
  supplierId: z.coerce.number().int().positive(),
  items: z.array(purchaseItemSchema).min(1, 'At least one product required'),
});

export const saleItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
});

export const saleSchema = z.object({
  customerId: z.coerce.number().int().positive().optional().nullable(),
  items: z.array(saleItemSchema).min(1, 'At least one product required'),
});

export const paymentSchema = z.object({
  saleId: z.coerce.number().int().positive(),
  paymentMethod: z.enum(['CASH', 'ZAAD', 'EDAHAB', 'CARD']),
  paidAmount: z.coerce.number().positive(),
  discount: z.coerce.number().min(0).optional(),
});

export const employeeSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().optional(),
  position: z.string().min(1),
  salary: z.coerce.number().positive(),
  hireDate: z.string().optional(),
});

export const salaryPaymentSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive(),
  paymentMonth: z.coerce.number().int().min(1).max(12),
  paymentYear: z.coerce.number().int().min(2000),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
