import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { purchasesApi, suppliersApi, productsApi } from '../api';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';

interface PurchaseItem { productId: number; quantity: number; unitPrice: number; }

export default function PurchasesPage() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([{ productId: 0, quantity: 1, unitPrice: 0 }]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: viewData } = useQuery({
    queryKey: ['purchase', viewId],
    queryFn: async () => (await purchasesApi.getOne(viewId!)).data.data,
    enabled: !!viewId && viewOpen,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', page],
    queryFn: async () => (await purchasesApi.getAll({ page, limit: 10 })).data,
  });

  const { data: suppliers } = useQuery({ queryKey: ['suppliers-all'], queryFn: async () => (await suppliersApi.getAll({ limit: 100 })).data.data });
  const { data: products } = useQuery({ queryKey: ['products-all'], queryFn: async () => (await productsApi.getAll({ limit: 100 })).data.data });

  const mutation = useMutation({
    mutationFn: () => purchasesApi.create({ supplierId: Number(supplierId), items: items.filter((i) => i.productId > 0) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchases'] }); queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Purchase created'); setModalOpen(false); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => purchasesApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchases'] }); toast.success('Deleted'); },
  });

  const addItem = () => setItems([...items, { productId: 0, quantity: 1, unitPrice: 0 }]);
  const updateItem = (idx: number, field: keyof PurchaseItem, value: number) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    if (field === 'productId') {
      const prod = products?.find((p: { productId: number; buyingPrice: number }) => p.productId === value);
      if (prod) next[idx].unitPrice = Number(prod.buyingPrice);
    }
    setItems(next);
  };

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between"><h1 className="text-2xl font-bold">Purchases</h1>
        <button onClick={() => { setSupplierId(''); setItems([{ productId: 0, quantity: 1, unitPrice: 0 }]); setModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> New Purchase</button>
      </div>
      {isLoading ? <LoadingSkeleton /> : !data?.data?.length ? <EmptyState /> : (
        <div className="card overflow-x-auto">
          <table className="w-full"><thead><tr className="border-b border-ui-card"><th className="p-3 text-left">ID</th><th className="p-3 text-left">Supplier</th><th className="p-3 text-left">Date</th><th className="p-3 text-right">Total</th><th className="p-3">Actions</th></tr></thead>
            <tbody>{data.data.map((p: { purchaseId: number; supplier: { supplierName: string }; purchaseDate: string; totalAmount: number }) => (
              <tr key={p.purchaseId} className="border-b border-ui-card/50">
                <td className="p-3">#{p.purchaseId}</td><td className="p-3">{p.supplier.supplierName}</td>
                <td className="p-3">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                <td className="p-3 text-right font-medium">${Number(p.totalAmount).toFixed(2)}</td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => { setViewId(p.purchaseId); setViewOpen(true); }} className="text-brand-primary" title="View"><Eye size={16} /></button>
                    <button onClick={() => deleteMutation.mutate(p.purchaseId)} className="text-accent-danger"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
          <Pagination page={page} totalPages={data.pagination?.totalPages ?? 1} onPageChange={setPage} />
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Purchase Invoice" size="xl">
        <div className="space-y-4">
          <div><label className="block text-sm mb-1">Supplier</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input-field">
              <option value="">Select supplier...</option>
              {suppliers?.map((s: { supplierId: number; supplierName: string }) => <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center"><h4 className="font-medium">Products</h4><button onClick={addItem} className="text-sm text-brand-primary">+ Add Item</button></div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2">
                <select value={item.productId} onChange={(e) => updateItem(idx, 'productId', Number(e.target.value))} className="input-field col-span-2">
                  <option value={0}>Select product...</option>
                  {products?.map((p: { productId: number; productName: string }) => <option key={p.productId} value={p.productId}>{p.productName}</option>)}
                </select>
                <input type="number" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} className="input-field" placeholder="Qty" min={1} />
                <input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))} className="input-field" placeholder="Price" />
              </div>
            ))}
          </div>
          <div className="text-right font-bold text-lg">Total: ${total.toFixed(2)}</div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => mutation.mutate()} disabled={!supplierId || mutation.isPending} className="btn-primary">Create Purchase</button>
          </div>
        </div>
      </Modal>
      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title={`Purchase #${viewId}`} size="lg">
        {viewData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><span className="text-brand-deep/70">Supplier:</span> {viewData.supplier?.supplierName}</p>
              <p><span className="text-brand-deep/70">Date:</span> {new Date(viewData.purchaseDate).toLocaleDateString()}</p>
              <p><span className="text-brand-deep/70">By:</span> {viewData.user?.fullName}</p>
              <p><span className="text-brand-deep/70">Total:</span> <strong>${Number(viewData.totalAmount).toFixed(2)}</strong></p>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="p-2 text-left">Product</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Price</th><th className="p-2 text-right">Subtotal</th></tr></thead>
              <tbody>
                {viewData.details?.map((d: { purchaseDetailId: number; product: { productName: string }; quantity: number; unitPrice: number }) => (
                  <tr key={d.purchaseDetailId} className="border-b border-ui-card/50">
                    <td className="p-2">{d.product.productName}</td>
                    <td className="p-2 text-right">{d.quantity}</td>
                    <td className="p-2 text-right">${Number(d.unitPrice).toFixed(2)}</td>
                    <td className="p-2 text-right">${(d.quantity * Number(d.unitPrice)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <LoadingSkeleton rows={3} />}
      </Modal>
    </div>
  );
}
