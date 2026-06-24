import { useQuery } from '@tanstack/react-query';
import {
  Package, Tags, Truck, Users, UserCog, ShoppingCart, DollarSign, ShoppingBag, AlertTriangle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';
import { dashboardApi } from '../api';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import type { DashboardStats } from '../types';

const StatCard = ({ title, value, icon, color }: { title: string; value: number | string; icon: React.ReactNode; color: string }) => (
  <div className="card flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
    <div>
      <p className="text-sm text-brand-deep/70 dark:text-ui-card/70">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const year = new Date().getFullYear();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => (await dashboardApi.getStats()).data.data as DashboardStats,
  });

  const { data: monthlySales } = useQuery({
    queryKey: ['monthly-sales', year],
    queryFn: async () => (await dashboardApi.getMonthlySales(year)).data.data,
  });

  const { data: topProducts } = useQuery({
    queryKey: ['top-products'],
    queryFn: async () => (await dashboardApi.getTopProducts()).data.data,
  });

  const { data: purchasesByMonth } = useQuery({
    queryKey: ['purchases-month', year],
    queryFn: async () => (await dashboardApi.getPurchasesByMonth(year)).data.data,
  });

  if (isLoading) return <LoadingSkeleton rows={8} />;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const salesChart = monthlySales?.map((m: { month: number; sales: number; revenue: number }) => ({
    name: monthNames[m.month - 1],
    sales: m.sales,
    revenue: m.revenue,
  }));

  const purchaseChart = purchasesByMonth?.map((m: { month: number; purchases: number; amount: number }) => ({
    name: monthNames[m.month - 1],
    purchases: m.purchases,
    amount: m.amount,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard title="Total Products" value={stats?.totalProducts ?? 0} icon={<Package className="text-brand-primary" />} color="bg-brand-primary/20" />
        <StatCard title="Categories" value={stats?.totalCategories ?? 0} icon={<Tags className="text-brand-deep" />} color="bg-brand-light/30" />
        <StatCard title="Suppliers" value={stats?.totalSuppliers ?? 0} icon={<Truck className="text-brand-deep" />} color="bg-ui-card" />
        <StatCard title="Customers" value={stats?.totalCustomers ?? 0} icon={<Users className="text-brand-primary" />} color="bg-brand-primary/20" />
        <StatCard title="Employees" value={stats?.totalEmployees ?? 0} icon={<UserCog className="text-brand-deep" />} color="bg-brand-light/30" />
        <StatCard title="Sales Today" value={stats?.totalSalesToday ?? 0} icon={<ShoppingCart className="text-brand-primary" />} color="bg-brand-primary/20" />
        <StatCard title="Total Revenue" value={`$${(stats?.totalRevenue ?? 0).toFixed(2)}`} icon={<DollarSign className="text-brand-primary" />} color="bg-brand-primary/20" />
        <StatCard title="Low Stock" value={stats?.lowStockProducts ?? 0} icon={<AlertTriangle className="text-accent-warning" />} color="bg-accent-warning/20" />
        <StatCard title="Total Purchases" value={stats?.totalPurchases ?? 0} icon={<ShoppingBag className="text-brand-deep" />} color="bg-ui-card" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Monthly Sales</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#4CAF6A" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={salesChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#33544E" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-4">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="productName" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="totalSold" fill="#8BE28A" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-4">Purchases by Month</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={purchaseChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#F08A4B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
