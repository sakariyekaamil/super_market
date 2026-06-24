import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { employeesApi } from '../api';
import Modal from '../components/ui/Modal';
import ActionIconButton from '../components/ui/ActionIconButton';
import SearchInput from '../components/ui/SearchInput';
import Pagination from '../components/ui/Pagination';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import type { Employee } from '../types';

const schema = z.object({
  fullName: z.string().min(1),
  phone: z.string().optional(),
  position: z.string().min(1),
  salary: z.coerce.number().positive(),
  hireDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EmployeesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, search],
    queryFn: async () => (await employeesApi.getAll({ page, limit: 10, search })).data,
  });

  const { register, handleSubmit, reset } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (form: FormData) => editing ? employeesApi.update(editing.employeeId, form) : employeesApi.create(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); toast.success('Saved'); setModalOpen(false); },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => employeesApi.deactivate(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); toast.success('Deactivated'); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between"><h1 className="text-2xl font-bold">Employees</h1>
        <button onClick={() => { setEditing(null); reset({}); setModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Employee</button>
      </div>
      <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
      {isLoading ? <LoadingSkeleton /> : !data?.data?.length ? <EmptyState /> : (
        <div className="card overflow-x-auto">
          <table className="w-full"><thead><tr className="border-b border-ui-card">
            <th className="p-3 text-left">Name</th><th className="p-3 text-left">Position</th><th className="p-3 text-left">Phone</th>
            <th className="p-3 text-right">Salary</th><th className="p-3 text-left">Status</th><th className="p-3">Actions</th>
          </tr></thead>
            <tbody>{(data.data as Employee[]).map((e) => (
              <tr key={e.employeeId} className="border-b border-ui-card/50">
                <td className="p-3">{e.fullName}</td><td className="p-3">{e.position}</td><td className="p-3">{e.phone || '-'}</td>
                <td className="p-3 text-right">${Number(e.salary).toFixed(2)}</td>
                <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${e.status === 'ACTIVE' ? 'bg-brand-primary/20 text-brand-primary' : 'bg-accent-danger/20 text-accent-danger'}`}>{e.status}</span></td>
                <td className="p-3 flex gap-2 justify-center">
                  <div className="action-group">
                    <ActionIconButton
                      icon={Pencil}
                      title="Edit"
                      variant="warning"
                      onClick={() => { setEditing(e); reset({ ...e, salary: Number(e.salary), hireDate: e.hireDate?.split('T')[0] }); setModalOpen(true); }}
                    />
                    {e.status === 'ACTIVE' && (
                      <ActionIconButton icon={UserX} title="Deactivate" variant="danger" onClick={() => deactivateMutation.mutate(e.employeeId)} />
                    )}
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
          <Pagination page={page} totalPages={data.pagination?.totalPages ?? 1} onPageChange={setPage} />
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Employee' : 'Add Employee'}>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div><label className="block text-sm mb-1">Full Name</label><input {...register('fullName')} className="input-field" /></div>
          <div><label className="block text-sm mb-1">Position</label><input {...register('position')} className="input-field" /></div>
          <div><label className="block text-sm mb-1">Phone</label><input {...register('phone')} className="input-field" /></div>
          <div><label className="block text-sm mb-1">Salary</label><input type="number" step="0.01" {...register('salary')} className="input-field" /></div>
          <div><label className="block text-sm mb-1">Hire Date</label><input type="date" {...register('hireDate')} className="input-field" /></div>
          <div className="flex gap-2 justify-end"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Save</button></div>
        </form>
      </Modal>
    </div>
  );
}
