import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { salaryPaymentsApi, employeesApi } from '../api';
import Modal from '../components/ui/Modal';
import ActionIconButton from '../components/ui/ActionIconButton';
import Pagination from '../components/ui/Pagination';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';

export default function SalaryPaymentsPage() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentMonth, setPaymentMonth] = useState(new Date().getMonth() + 1);
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear());
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['salary-payments', page],
    queryFn: async () => (await salaryPaymentsApi.getAll({ page, limit: 10 })).data,
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-active'],
    queryFn: async () => (await employeesApi.getAll({ limit: 100 })).data.data.filter((e: { status: string }) => e.status === 'ACTIVE'),
  });

  const mutation = useMutation({
    mutationFn: () => salaryPaymentsApi.create({ employeeId: Number(employeeId), amount, paymentMonth, paymentYear }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['salary-payments'] }); toast.success('Salary paid'); setModalOpen(false); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => salaryPaymentsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['salary-payments'] }); toast.success('Deleted'); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-4">
      <div className="flex justify-between"><h1 className="text-2xl font-bold">Payroll</h1>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Pay Salary</button>
      </div>
      {isLoading ? <LoadingSkeleton /> : !data?.data?.length ? <EmptyState title="No salary payments" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full"><thead><tr className="border-b border-ui-card">
            <th className="p-3 text-left">Employee</th><th className="p-3 text-left">Period</th><th className="p-3 text-right">Amount</th><th className="p-3 text-left">Date</th><th className="p-3">Actions</th>
          </tr></thead>
            <tbody>{data.data.map((p: { salaryPaymentId: number; employee: { fullName: string }; paymentMonth: number; paymentYear: number; amount: number; paymentDate: string }) => (
              <tr key={p.salaryPaymentId} className="border-b border-ui-card/50">
                <td className="p-3">{p.employee.fullName}</td>
                <td className="p-3">{months[p.paymentMonth - 1]} {p.paymentYear}</td>
                <td className="p-3 text-right font-medium">${Number(p.amount).toFixed(2)}</td>
                <td className="p-3">{new Date(p.paymentDate).toLocaleDateString()}</td>
                <td className="p-3 text-center">
                  <ActionIconButton icon={Trash2} title="Delete" variant="danger" onClick={() => deleteMutation.mutate(p.salaryPaymentId)} />
                </td>
              </tr>
            ))}</tbody>
          </table>
          <Pagination page={page} totalPages={data.pagination?.totalPages ?? 1} onPageChange={setPage} />
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Pay Salary">
        <div className="space-y-4">
          <div><label className="block text-sm mb-1">Employee</label>
            <select value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); const emp = employees?.find((x: { employeeId: number; salary: number }) => x.employeeId === Number(e.target.value)); if (emp) setAmount(Number(emp.salary)); }} className="input-field">
              <option value="">Select employee...</option>
              {employees?.map((e: { employeeId: number; fullName: string; salary: number }) => <option key={e.employeeId} value={e.employeeId}>{e.fullName} - ${Number(e.salary).toFixed(2)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm mb-1">Month</label>
              <select value={paymentMonth} onChange={(e) => setPaymentMonth(Number(e.target.value))} className="input-field">
                {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div><label className="block text-sm mb-1">Year</label><input type="number" value={paymentYear} onChange={(e) => setPaymentYear(Number(e.target.value))} className="input-field" /></div>
          </div>
          <div><label className="block text-sm mb-1">Amount</label><input type="number" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="input-field" /></div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => mutation.mutate()} disabled={!employeeId || mutation.isPending} className="btn-primary">Pay Salary</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
