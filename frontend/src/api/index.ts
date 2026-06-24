import api from './client';
import type { User, ApiResponse } from '../types';

export const authApi = {
  login: (username: string, password: string) =>
    api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get<ApiResponse<User>>('/auth/profile'),
  register: (data: { fullName: string; username: string; password: string; role: string }) =>
    api.post('/auth/register', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  getUsers: (params?: Record<string, string | number>) => api.get('/auth/users', { params }),
  updateUser: (id: number, data: object) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/auth/users/${id}`),
};

export const categoriesApi = {
  getAll: (params?: Record<string, string | number>) => api.get('/categories', { params }),
  create: (data: object) => api.post('/categories', data),
  update: (id: number, data: object) => api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

export const suppliersApi = {
  getAll: (params?: Record<string, string | number>) => api.get('/suppliers', { params }),
  create: (data: object) => api.post('/suppliers', data),
  update: (id: number, data: object) => api.put(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete(`/suppliers/${id}`),
};

export const productsApi = {
  getAll: (params?: Record<string, string | number | boolean>) => api.get('/products', { params }),
  getLowStock: () => api.get('/products/low-stock'),
  getByBarcode: (barcode: string) => api.get(`/products/barcode/${barcode}`),
  create: (data: object) => api.post('/products', data),
  update: (id: number, data: object) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

export const customersApi = {
  getAll: (params?: Record<string, string | number>) => api.get('/customers', { params }),
  getHistory: (id: number) => api.get(`/customers/${id}/history`),
  create: (data: object) => api.post('/customers', data),
  update: (id: number, data: object) => api.put(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
};

export const purchasesApi = {
  getAll: (params?: Record<string, string | number>) => api.get('/purchases', { params }),
  getOne: (id: number) => api.get(`/purchases/${id}`),
  create: (data: object) => api.post('/purchases', data),
  delete: (id: number) => api.delete(`/purchases/${id}`),
};

export const salesApi = {
  getAll: (params?: Record<string, string | number>) => api.get('/sales', { params }),
  create: (data: object) => api.post('/sales', data),
  getReceipt: (id: number) => api.get(`/sales/${id}/receipt`),
  delete: (id: number) => api.delete(`/sales/${id}`),
};

export const paymentsApi = {
  getAll: (params?: Record<string, string | number>) => api.get('/payments', { params }),
  getOne: (id: number) => api.get(`/payments/${id}`),
  create: (data: object) => api.post('/payments', data),
  update: (id: number, data: object) => api.put(`/payments/${id}`, data),
  delete: (id: number) => api.delete(`/payments/${id}`),
};

export const employeesApi = {
  getAll: (params?: Record<string, string | number>) => api.get('/employees', { params }),
  create: (data: object) => api.post('/employees', data),
  update: (id: number, data: object) => api.put(`/employees/${id}`, data),
  deactivate: (id: number) => api.patch(`/employees/${id}/deactivate`),
  delete: (id: number) => api.delete(`/employees/${id}`),
};

export const salaryPaymentsApi = {
  getAll: (params?: Record<string, string | number>) => api.get('/salary-payments', { params }),
  create: (data: object) => api.post('/salary-payments', data),
  delete: (id: number) => api.delete(`/salary-payments/${id}`),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getMonthlySales: (year?: number) => api.get('/dashboard/charts/monthly-sales', { params: { year } }),
  getTopProducts: () => api.get('/dashboard/charts/top-products'),
  getPurchasesByMonth: (year?: number) => api.get('/dashboard/charts/purchases-by-month', { params: { year } }),
};

export const reportsApi = {
  dailySales: (date?: string) => api.get('/reports/daily-sales', { params: { date } }),
  monthlySales: (month?: number, year?: number) => api.get('/reports/monthly-sales', { params: { month, year } }),
  revenue: (year?: number) => api.get('/reports/revenue', { params: { year } }),
  purchases: (year?: number) => api.get('/reports/purchases', { params: { year } }),
  inventory: () => api.get('/reports/inventory'),
  profit: (year?: number) => api.get('/reports/profit', { params: { year } }),
  salary: (month?: number, year?: number) => api.get('/reports/salary', { params: { month, year } }),
  export: (type: string, format: string, year?: number) =>
    api.get('/reports/export', { params: { type, format, year }, responseType: 'blob' }),
};
