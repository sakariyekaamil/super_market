import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { salesApi, customersApi, productsApi } from '../api';
import Modal from '../components/ui/Modal';
import ActionIconButton from '../components/ui/ActionIconButton';
import SaleInvoiceModal from '../components/SaleInvoiceModal';
import Pagination from '../components/ui/Pagination';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';

interface SaleItem { productId: number; quantity: number; }

export default function SalesPage() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<SaleItem[]>([{ productId: 0, quantity: 1 }]);
  const [barcode, setBarcode] = useState('');
  const [invoiceSaleId, setInvoiceSaleId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['sales', page],
    queryFn: async () => (await salesApi.getAll({ page, limit: 10 })).data,
  });

  const { data: customers } = useQuery({ queryKey: ['customers-all'], queryFn: async () => (await customersApi.getAll({ limit: 100 })).data.data });
  const { data: products } = useQuery({ queryKey: ['products-all'], queryFn: async () => (await productsApi.getAll({ limit: 100 })).data.data });

  const mutation = useMutation({
    mutationFn: () => salesApi.create({
      customerId: customerId ? Number(customerId) : null,
      items: items.filter((i) => i.productId > 0),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Sale created');
      setModalOpen(false);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => salesApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sales'] }); toast.success('Deleted'); },
  });

  const searchBarcode = async () => {
    if (!barcode) return;
    try {
      const res = await productsApi.getByBarcode(barcode);
      const prod = res.data.data;
      setItems([...items.filter((i) => i.productId !== prod.productId), { productId: prod.productId, quantity: 1 }]);
      setBarcode('');
      toast.success(`Added ${prod.productName}`);
    } catch {
      toast.error('Product not found');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between"><h1 className="text-2xl font-bold">Sales</h1>
        <button onClick={() => { setCustomerId(''); setItems([{ productId: 0, quantity: 1 }]); setModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> New Sale</button>
      </div>
      {isLoading ? <LoadingSkeleton /> : !data?.data?.length ? <EmptyState /> : (
        <div className="card overflow-x-auto">
          <table className="w-full"><thead><tr className="border-b border-ui-card">
            <th className="p-3 text-left">ID</th><th className="p-3 text-left">Customer</th><th className="p-3 text-left">Date</th>
            <th className="p-3 text-right">Total</th><th className="p-3 text-center">Paid</th><th className="p-3">Actions</th>
          </tr></thead>
            <tbody>{data.data.map((s: { saleId: number; customer?: { fullName: string }; saleDate: string; totalAmount: number; payment?: unknown }) => (
              <tr key={s.saleId} className="border-b border-ui-card/50">
                <td className="p-3">#{s.saleId}</td>
                <td className="p-3">{s.customer?.fullName || 'Walk-in'}</td>
                <td className="p-3">{new Date(s.saleDate).toLocaleDateString()}</td>
                <td className="p-3 text-right font-medium">${Number(s.totalAmount).toFixed(2)}</td>
                <td className="p-3 text-center">{s.payment ? <span className="text-brand-primary text-sm">Paid</span> : <span className="text-accent-warning text-sm">Pending</span>}</td>
                <td className="p-3">
                  <div className="action-group">
                    <ActionIconButton icon={FileText} title="Invoice" variant="brand" onClick={() => setInvoiceSaleId(s.saleId)} />
                    {!s.payment && (
                      <ActionIconButton icon={Trash2} title="Delete" variant="danger" onClick={() => deleteMutation.mutate(s.saleId)} />
                    )}
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
          <Pagination page={page} totalPages={data.pagination?.totalPages ?? 1} onPageChange={setPage} />
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Sale" size="xl">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input value={barcode} onChange={(e) => setBarcode(e.target.value)} className="input-field" placeholder="Scan barcode..." onKeyDown={(e) => e.key === 'Enter' && searchBarcode()} />
            <button onClick={searchBarcode} className="btn-secondary">Search</button>
          </div>
          <div><label className="block text-sm mb-1">Customer (optional)</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="input-field">
              <option value="">Walk-in Customer</option>
              {customers?.map((c: { customerId: number; fullName: string }) => <option key={c.customerId} value={c.customerId}>{c.fullName}</option>)}
            </select>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-2">
              <select value={item.productId} onChange={(e) => { const n = [...items]; n[idx].productId = Number(e.target.value); setItems(n); }} className="input-field">
                <option value={0}>Select product...</option>
                {products?.map((p: { productId: number; productName: string; quantity: number; sellingPrice: number }) =>
                  <option key={p.productId} value={p.productId}>{p.productName} (Stock: {p.quantity}) - ${Number(p.sellingPrice).toFixed(2)}</option>)}
              </select>
              <input type="number" value={item.quantity} min={1} onChange={(e) => { const n = [...items]; n[idx].quantity = Number(e.target.value); setItems(n); }} className="input-field" />
            </div>
          ))}
          <button onClick={() => setItems([...items, { productId: 0, quantity: 1 }])} className="text-sm text-brand-primary">+ Add Item</button>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary">Create Sale</button>
          </div>
        </div>
      </Modal>
      <SaleInvoiceModal saleId={invoiceSaleId} onClose={() => setInvoiceSaleId(null)} />
    </div>
  );
}
