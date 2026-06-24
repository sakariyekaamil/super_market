import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoriesApi } from '../api';
import Modal from '../components/ui/Modal';
import SearchInput from '../components/ui/SearchInput';
import Pagination from '../components/ui/Pagination';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import type { Category } from '../types';

const schema = z.object({
  categoryName: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['categories', page, search],
    queryFn: async () => (await categoriesApi.getAll({ page, limit: 10, search })).data,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (form: FormData) =>
      editing ? categoriesApi.update(editing.categoryId, form) : categoriesApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(editing ? 'Category updated' : 'Category created');
      closeModal();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'Operation failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted');
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'Delete failed'),
  });

  const openCreate = () => { setEditing(null); reset({ categoryName: '', description: '' }); setModalOpen(true); };
  const openEdit = (cat: Category) => { setEditing(cat); reset(cat); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Category</button>
      </div>
      <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search categories..." />
      {isLoading ? <LoadingSkeleton /> : !data?.data?.length ? <EmptyState /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-ui-card">
                <th className="p-3">Name</th>
                <th className="p-3">Description</th>
                <th className="p-3 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data.data as Category[]).map((cat) => (
                <tr key={cat.categoryId} className="border-b border-ui-card/50 hover:bg-ui-card/30">
                  <td className="p-3 font-medium">{cat.categoryName}</td>
                  <td className="p-3">{cat.description || '-'}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => openEdit(cat)} className="text-accent-warning"><Pencil size={16} /></button>
                    <button onClick={() => deleteMutation.mutate(cat.categoryId)} className="text-accent-danger"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={data.pagination?.totalPages ?? 1} onPageChange={setPage} />
        </div>
      )}
      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input {...register('categoryName')} className="input-field" />
            {errors.categoryName && <p className="text-accent-danger text-sm">{errors.categoryName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea {...register('description')} className="input-field" rows={3} />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
