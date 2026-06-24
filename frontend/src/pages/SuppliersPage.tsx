import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { suppliersApi } from '../api';
import Modal from '../components/ui/Modal';
import SearchInput from '../components/ui/SearchInput';
import Pagination from '../components/ui/Pagination';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import type { Supplier } from '../types';

const schema = z.object({
  supplierName: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function SuppliersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page, search],
    queryFn: async () => (await suppliersApi.getAll({ page, limit: 10, search })).data,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (form: FormData) => editing ? suppliersApi.update(editing.supplierId, form) : suppliersApi.create(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); toast.success(editing ? 'Updated' : 'Created'); setModalOpen(false); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => suppliersApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); toast.success('Deleted'); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <button onClick={() => { setEditing(null); reset({}); setModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Supplier</button>
      </div>
      <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
      {isLoading ? <LoadingSkeleton /> : !data?.data?.length ? <EmptyState /> : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-ui-card"><th className="p-3 text-left">Name</th><th className="p-3 text-left">Phone</th><th className="p-3 text-left">Address</th><th className="p-3">Actions</th></tr></thead>
            <tbody>
              {(data.data as Supplier[]).map((s) => (
                <tr key={s.supplierId} className="border-b border-ui-card/50">
                  <td className="p-3">{s.supplierName}</td><td className="p-3">{s.phone || '-'}</td><td className="p-3">{s.address || '-'}</td>
                  <td className="p-3 flex gap-2 justify-center">
                    <button onClick={() => { setEditing(s); reset(s); setModalOpen(true); }} className="text-accent-warning"><Pencil size={16} /></button>
                    <button onClick={() => deleteMutation.mutate(s.supplierId)} className="text-accent-danger"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={data.pagination?.totalPages ?? 1} onPageChange={setPage} />
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'}>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div><label className="block text-sm mb-1">Name</label><input {...register('supplierName')} className="input-field" />{errors.supplierName && <p className="text-accent-danger text-sm">{errors.supplierName.message}</p>}</div>
          <div><label className="block text-sm mb-1">Phone</label><input {...register('phone')} className="input-field" /></div>
          <div><label className="block text-sm mb-1">Address</label><input {...register('address')} className="input-field" /></div>
          <div className="flex gap-2 justify-end"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Save</button></div>
        </form>
      </Modal>
    </div>
  );
}
