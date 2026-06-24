import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentsApi, salesApi } from '../api';
import Modal from '../components/ui/Modal';
import ActionIconButton from '../components/ui/ActionIconButton';
import PaymentInvoiceModal, { PaymentInvoiceTarget } from '../components/PaymentInvoiceModal';
import Pagination from '../components/ui/Pagination';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';

interface PaymentRow {
  paymentId: number;
  saleId: number;
  paymentMethod: string;
  paidAmount: number;
  discount: number;
  changeAmount: number;
  paymentDate: string;
}

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentRow | null>(null);
  const [saleId, setSaleId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paidAmount, setPaidAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [invoiceTarget, setInvoiceTarget] = useState<PaymentInvoiceTarget | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page],
    queryFn: async () => (await paymentsApi.getAll({ page, limit: 10 })).data,
  });

  const { data: unpaidSales } = useQuery({
    queryKey: ['unpaid-sales'],
    queryFn: async () => {
      const res = await salesApi.getAll({ limit: 100 });
      return res.data.data.filter((s: { payment?: unknown }) => !s.payment);
    },
    enabled: modalOpen && !editing,
  });

  const selectedSale = unpaidSales?.find((s: { saleId: number; totalAmount: number }) => s.saleId === Number(saleId));
  const baseTotal = editing
    ? Number(editing.paidAmount) + Number(editing.discount) - Number(editing.changeAmount)
    : selectedSale
      ? Number(selectedSale.totalAmount)
      : 0;
  const totalAfterDiscount = baseTotal - discount;
  const changeAmount = paidAmount > totalAfterDiscount ? paidAmount - totalAfterDiscount : 0;

  const openCreate = () => {
    setEditing(null);
    setSaleId('');
    setPaymentMethod('CASH');
    setPaidAmount(0);
    setDiscount(0);
    setModalOpen(true);
  };

  const openEdit = (p: PaymentRow) => {
    setEditing(p);
    setPaymentMethod(p.paymentMethod);
    setPaidAmount(Number(p.paidAmount));
    setDiscount(Number(p.discount));
    setModalOpen(true);
  };

  const mutation = useMutation({
    mutationFn: () =>
      editing
        ? paymentsApi.update(editing.paymentId, { paymentMethod, paidAmount, discount })
        : paymentsApi.create({ saleId: Number(saleId), paymentMethod, paidAmount, discount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success(editing ? 'Payment updated' : 'Payment recorded');
      setModalOpen(false);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => paymentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Payment deleted');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Payments</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Record Payment
        </button>
      </div>
      {isLoading ? (
        <LoadingSkeleton />
      ) : !data?.data?.length ? (
        <EmptyState />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ui-card">
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Sale</th>
                <th className="p-3 text-left">Method</th>
                <th className="p-3 text-right">Paid</th>
                <th className="p-3 text-right">Discount</th>
                <th className="p-3 text-right">Change</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data.data as PaymentRow[]).map((p) => (
                <tr key={p.paymentId} className="border-b border-ui-card/50">
                  <td className="p-3">#{p.paymentId}</td>
                  <td className="p-3">Sale #{p.saleId}</td>
                  <td className="p-3">
                    <span className="rounded bg-brand-primary/20 px-2 py-1 text-sm text-brand-primary">{p.paymentMethod}</span>
                  </td>
                  <td className="p-3 text-right">${Number(p.paidAmount).toFixed(2)}</td>
                  <td className="p-3 text-right">${Number(p.discount).toFixed(2)}</td>
                  <td className="p-3 text-right">${Number(p.changeAmount).toFixed(2)}</td>
                  <td className="p-3">{new Date(p.paymentDate).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="action-group">
                      <ActionIconButton
                        icon={FileText}
                        title="Payment Invoice"
                        variant="brand"
                        onClick={() =>
                          setInvoiceTarget({
                            paymentId: p.paymentId,
                            saleId: p.saleId,
                            paymentDate: p.paymentDate,
                          })
                        }
                      />
                      <ActionIconButton icon={Pencil} title="Edit" variant="warning" onClick={() => openEdit(p)} />
                      <ActionIconButton icon={Trash2} title="Delete" variant="danger" onClick={() => deleteMutation.mutate(p.paymentId)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={data.pagination?.totalPages ?? 1} onPageChange={setPage} />
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Payment' : 'Record Payment'}>
        <div className="space-y-4">
          {!editing && (
            <div>
              <label className="mb-1 block text-sm">Sale</label>
              <select
                value={saleId}
                onChange={(e) => {
                  setSaleId(e.target.value);
                  const s = unpaidSales?.find((x: { saleId: number; totalAmount: number }) => x.saleId === Number(e.target.value));
                  if (s) setPaidAmount(Number(s.totalAmount));
                }}
                className="input-field"
              >
                <option value="">Select unpaid sale...</option>
                {unpaidSales?.map((s: { saleId: number; totalAmount: number; customer?: { fullName: string } }) => (
                  <option key={s.saleId} value={s.saleId}>
                    #{s.saleId} - {s.customer?.fullName || 'Walk-in'} - ${Number(s.totalAmount).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm">Payment Method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-field">
              <option value="CASH">Cash</option>
              <option value="ZAAD">Zaad</option>
              <option value="EDAHAB">Edahab</option>
              <option value="CARD">Card</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">Discount ($)</label>
            <input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="input-field" min={0} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Paid Amount ($)</label>
            <input type="number" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} className="input-field" />
          </div>
          {(selectedSale || editing) && (
            <div className="space-y-1 rounded-lg bg-ui-card/50 p-3 text-sm">
              <p>After Discount: ${totalAfterDiscount.toFixed(2)}</p>
              <p className="font-bold">Change: ${changeAmount.toFixed(2)}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => mutation.mutate()} disabled={(!editing && !saleId) || mutation.isPending} className="btn-primary">
              {editing ? 'Update' : 'Record'}
            </button>
          </div>
        </div>
      </Modal>
      <PaymentInvoiceModal target={invoiceTarget} onClose={() => setInvoiceTarget(null)} />
    </div>
  );
}
