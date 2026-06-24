import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersApi } from '../api';
import Modal from '../components/ui/Modal';
import ActionIconButton from '../components/ui/ActionIconButton';
import CustomerHistoryModal from '../components/CustomerHistoryModal';
import SaleInvoiceModal from '../components/SaleInvoiceModal';
import SearchInput from '../components/ui/SearchInput';
import Pagination from '../components/ui/Pagination';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import type { Customer } from '../types';

const schema = z.object({ fullName: z.string().min(1), phone: z.string().optional(), address: z.string().optional() });
type FormData = z.infer<typeof schema>;

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [invoiceSaleId, setInvoiceSaleId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: async () => (await customersApi.getAll({ page, limit: 10, search })).data,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['customer-history', selectedCustomer?.customerId],
    queryFn: async () => (await customersApi.getHistory(selectedCustomer!.customerId)).data.data,
    enabled: !!selectedCustomer && historyOpen,
  });

  const { register, handleSubmit, reset } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (form: FormData) => editing ? customersApi.update(editing.customerId, form) : customersApi.create(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); toast.success('Saved'); setModalOpen(false); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customersApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); toast.success('Deleted'); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between"><h1 className="text-2xl font-bold">Customers</h1>
        <button onClick={() => { setEditing(null); reset({}); setModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Customer</button>
      </div>
      <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
      {isLoading ? <LoadingSkeleton /> : !data?.data?.length ? <EmptyState /> : (
        <div className="card overflow-x-auto">
          <table className="w-full"><thead><tr className="border-b border-ui-card"><th className="p-3 text-left">Name</th><th className="p-3 text-left">Phone</th><th className="p-3 text-left">Address</th><th className="p-3">Actions</th></tr></thead>
            <tbody>{(data.data as Customer[]).map((c) => (
              <tr key={c.customerId} className="border-b border-ui-card/50">
                <td className="p-3">{c.fullName}</td><td className="p-3">{c.phone || '-'}</td><td className="p-3">{c.address || '-'}</td>
                <td className="p-3">
                  <div className="action-group">
                    <ActionIconButton
                      icon={History}
                      title="History"
                      variant="brand"
                      onClick={() => { setSelectedCustomer(c); setHistoryOpen(true); }}
                    />
                    <ActionIconButton
                      icon={Pencil}
                      title="Edit"
                      variant="warning"
                      onClick={() => { setEditing(c); reset(c); setModalOpen(true); }}
                    />
                    <ActionIconButton icon={Trash2} title="Delete" variant="danger" onClick={() => deleteMutation.mutate(c.customerId)} />
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
          <Pagination page={page} totalPages={data.pagination?.totalPages ?? 1} onPageChange={setPage} />
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div><label className="block text-sm mb-1">Full Name</label><input {...register('fullName')} className="input-field" /></div>
          <div><label className="block text-sm mb-1">Phone</label><input {...register('phone')} className="input-field" /></div>
          <div><label className="block text-sm mb-1">Address</label><input {...register('address')} className="input-field" /></div>
          <div className="flex gap-2 justify-end"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Save</button></div>
        </form>
      </Modal>
      <CustomerHistoryModal
        open={historyOpen}
        customerName={selectedCustomer?.fullName ?? ''}
        sales={history?.sales}
        loading={historyLoading}
        onClose={() => setHistoryOpen(false)}
        onViewInvoice={(saleId) => {
          setHistoryOpen(false);
          setInvoiceSaleId(saleId);
        }}
      />
      <SaleInvoiceModal saleId={invoiceSaleId} onClose={() => setInvoiceSaleId(null)} />
    </div>
  );
}
