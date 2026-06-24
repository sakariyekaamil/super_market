import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsApi } from '../api';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

const reportTypes = [
  { key: 'daily', label: 'Daily Sales', fn: () => reportsApi.dailySales() },
  { key: 'monthly', label: 'Monthly Sales', fn: () => reportsApi.monthlySales() },
  { key: 'revenue', label: 'Revenue', fn: () => reportsApi.revenue() },
  { key: 'purchases', label: 'Purchases', fn: () => reportsApi.purchases() },
  { key: 'inventory', label: 'Inventory', fn: () => reportsApi.inventory() },
  { key: 'profit', label: 'Profit', fn: () => reportsApi.profit() },
  { key: 'salary', label: 'Salary', fn: () => reportsApi.salary() },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('daily');
  const year = new Date().getFullYear();

  const { data, isLoading } = useQuery({
    queryKey: ['report', activeReport],
    queryFn: async () => {
      const report = reportTypes.find((r) => r.key === activeReport);
      return (await report!.fn()).data.data;
    },
  });

  const handleExport = async (type: string, format: 'pdf' | 'excel') => {
    try {
      const res = await reportsApi.export(type, format, year);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
      toast.success('Report downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  const renderReport = () => {
    if (isLoading) return <LoadingSkeleton />;
    if (!data) return null;

    if (activeReport === 'profit') {
      return (
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center"><p className="text-sm text-brand-deep/70">Revenue</p><p className="text-2xl font-bold text-brand-primary">${data.revenue?.toFixed(2)}</p></div>
          <div className="card text-center"><p className="text-sm text-brand-deep/70">Cost</p><p className="text-2xl font-bold text-accent-warning">${data.cost?.toFixed(2)}</p></div>
          <div className="card text-center"><p className="text-sm text-brand-deep/70">Profit</p><p className="text-2xl font-bold text-brand-deep">${data.profit?.toFixed(2)}</p></div>
        </div>
      );
    }

    if (activeReport === 'inventory') {
      return (
        <div className="card overflow-x-auto">
          <p className="mb-4 font-medium">Total Inventory Value: ${data.totalValue?.toFixed(2)}</p>
          <table className="w-full text-sm"><thead><tr className="border-b"><th className="p-2 text-left">Product</th><th className="p-2 text-left">Category</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Value</th></tr></thead>
            <tbody>{data.products?.slice(0, 20).map((p: { productId: number; productName: string; category: { categoryName: string }; quantity: number; buyingPrice: number }) => (
              <tr key={p.productId} className="border-b border-ui-card/50">
                <td className="p-2">{p.productName}</td><td className="p-2">{p.category?.categoryName}</td>
                <td className="p-2 text-right">{p.quantity}</td>
                <td className="p-2 text-right">${(Number(p.buyingPrice) * p.quantity).toFixed(2)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      );
    }

    const count = data.count ?? data.payments?.length ?? data.sales?.length ?? data.purchases?.length ?? 0;
    const total = data.total ?? 0;
    return (
      <div className="card">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><p className="text-sm text-brand-deep/70">Records</p><p className="text-2xl font-bold">{count}</p></div>
          <div><p className="text-sm text-brand-deep/70">Total</p><p className="text-2xl font-bold text-brand-primary">${Number(total).toFixed(2)}</p></div>
        </div>
        {data.byMethod && (
          <div className="space-y-2">
            <h4 className="font-medium">By Payment Method</h4>
            {Object.entries(data.byMethod).map(([method, amount]) => (
              <div key={method} className="flex justify-between"><span>{method}</span><span>${Number(amount).toFixed(2)}</span></div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex gap-2">
          <button onClick={() => handleExport('sales', 'pdf')} className="btn-secondary flex items-center gap-2"><FileDown size={16} /> Sales PDF</button>
          <button onClick={() => handleExport('inventory', 'excel')} className="btn-secondary flex items-center gap-2"><FileSpreadsheet size={16} /> Inventory Excel</button>
          <button onClick={() => handleExport('profit', 'pdf')} className="btn-secondary flex items-center gap-2"><FileDown size={16} /> Profit PDF</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {reportTypes.map((r) => (
          <button key={r.key} onClick={() => setActiveReport(r.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeReport === r.key ? 'bg-brand-primary text-white' : 'bg-ui-card hover:bg-brand-light/50'}`}>
            {r.label}
          </button>
        ))}
      </div>
      {renderReport()}
    </div>
  );
}
