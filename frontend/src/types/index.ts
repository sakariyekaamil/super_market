export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER';

export interface User {
  userId: number;
  fullName: string;
  username: string;
  role: Role;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: Pagination;
}

export interface Category {
  categoryId: number;
  categoryName: string;
  description?: string;
}

export interface Supplier {
  supplierId: number;
  supplierName: string;
  phone?: string;
  address?: string;
}

export interface Product {
  productId: number;
  productName: string;
  categoryId: number;
  supplierId: number;
  barcode?: string;
  buyingPrice: number;
  sellingPrice: number;
  quantity: number;
  category?: Category;
  supplier?: Supplier;
}

export interface Customer {
  customerId: number;
  fullName: string;
  phone?: string;
  address?: string;
}

export interface Employee {
  employeeId: number;
  fullName: string;
  phone?: string;
  position: string;
  salary: number;
  hireDate: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalSuppliers: number;
  totalCustomers: number;
  totalEmployees: number;
  totalSalesToday: number;
  totalRevenue: number;
  totalPurchases: number;
  lowStockProducts: number;
}
