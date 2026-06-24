import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi, categoriesApi, suppliersApi } from '../api';
import Modal from '../components/ui/Modal';
import ActionIconButton from '../components/ui/ActionIconButton';
import SearchInput from '../components/ui/SearchInput';
import Pagination from '../components/ui/Pagination';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import type { Product } from '../types';

const schema = z.object({
  productName: z.string().min(1),
  categoryId: z.coerce.number().positive(),
  supplierId: z.coerce.number().positive(),
  barcode: z.string().optional(),
  buyingPrice: z.coerce.number().positive(),
  sellingPrice: z.coerce.number().positive(),
  quantity: z.coerce.number().int().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, categoryFilter, lowStockOnly],
    queryFn: async () => (await productsApi.getAll({
      page, limit: 10, search,
      ...(categoryFilter && { categoryId: categoryFilter }),
      ...(lowStockOnly && { lowStock: 'true' }),
    })).data,
  });

  const { data: categories } = useQuery({ queryKey: ['categories-all'], queryFn: async () => (await categoriesApi.getAll({ limit: 100 })).data.data });
  const { data: suppliers } = useQuery({ queryKey: ['suppliers-all'], queryFn: async () => (await suppliersApi.getAll({ limit: 100 })).data.data });

  const { register, handleSubmit, reset } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (form: FormData) => editing ? productsApi.update(editing.productId, form) : productsApi.create(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Saved'); setModalOpen(false); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Deleted'); },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <button onClick={() => { setEditing(null); reset({ quantity: 0 }); setModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Product</button>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or barcode..." />
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="input-field sm:w-48">
          <option value="">All Categories</option>
          {categories?.map((c: { categoryId: number; categoryName: string }) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
        </select>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }} />
          <AlertTriangle size={16} className="text-accent-warning" /> Low Stock
        </label>
      </div>
      {isLoading ? <LoadingSkeleton /> : !data?.data?.length ? <EmptyState /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-ui-card">
              <th className="p-3 text-left">Product</th><th className="p-3 text-left">Barcode</th><th className="p-3 text-left">Category</th>
              <th className="p-3 text-right">Buy</th><th className="p-3 text-right">Sell</th><th className="p-3 text-right">Qty</th><th className="p-3">Actions</th>
            </tr></thead>
            <tbody>
              {(data.data as Product[]).map((p) => (
                <tr key={p.productId} className="border-b border-ui-card/50">
                  <td className="p-3 font-medium">{p.productName}</td>
                  <td className="p-3">{p.barcode || '-'}</td>
                  <td className="p-3">{p.category?.categoryName}</td>
                  <td className="p-3 text-right">${Number(p.buyingPrice).toFixed(2)}</td>
                  <td className="p-3 text-right">${Number(p.sellingPrice).toFixed(2)}</td>
                  <td className={`p-3 text-right font-medium ${p.quantity <= 10 ? 'text-accent-warning' : ''}`}>{p.quantity}</td>
                  <td className="p-3 flex gap-2">
                  <div className="action-group">
                    <ActionIconButton
                      icon={Pencil}
                      title="Edit"
                      variant="warning"
                      onClick={() => { setEditing(p); reset({ ...p, buyingPrice: Number(p.buyingPrice), sellingPrice: Number(p.sellingPrice) }); setModalOpen(true); }}
                    />
                    <ActionIconButton icon={Trash2} title="Delete" variant="danger" onClick={() => deleteMutation.mutate(p.productId)} />
                  </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={data.pagination?.totalPages ?? 1} onPageChange={setPage} />
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add Product'} size="lg">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="block text-sm mb-1">Product Name</label><input {...register('productName')} className="input-field" /></div>
          <div><label className="block text-sm mb-1">Category</label><select {...register('categoryId')} className="input-field"><option value="">Select...</option>{categories?.map((c: { categoryId: number; categoryName: string }) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}</select></div>
          <div><label className="block text-sm mb-1">Supplier</label><select {...register('supplierId')} className="input-field"><option value="">Select...</option>{suppliers?.map((s: { supplierId: number; supplierName: string }) => <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>)}</select></div>
          <div><label className="block text-sm mb-1">Barcode</label><input {...register('barcode')} className="input-field" /></div>
          <div><label className="block text-sm mb-1">Quantity</label><input type="number" {...register('quantity')} className="input-field" /></div>
          <div><label className="block text-sm mb-1">Buying Price</label><input type="number" step="0.01" {...register('buyingPrice')} className="input-field" /></div>
          <div><label className="block text-sm mb-1">Selling Price</label><input type="number" step="0.01" {...register('sellingPrice')} className="input-field" /></div>
          <div className="sm:col-span-2 flex gap-2 justify-end"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Save</button></div>
        </form>
      </Modal>
    </div>
  );
}
