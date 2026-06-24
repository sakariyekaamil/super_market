import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../api';
import { useAuthStore } from '../store';
import Modal from '../components/ui/Modal';
import ActionIconButton from '../components/ui/ActionIconButton';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import type { User } from '../types';

const registerSchema = z.object({
  fullName: z.string().min(2),
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']),
});

const updateSchema = z.object({
  fullName: z.string().min(2),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']),
});

type RegisterForm = z.infer<typeof registerSchema>;
type UpdateForm = z.infer<typeof updateSchema>;

export default function UsersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await authApi.getUsers({ limit: 50 })).data,
  });

  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema), defaultValues: { role: 'CASHIER' } });
  const updateForm = useForm<UpdateForm>({ resolver: zodResolver(updateSchema) });

  const createMutation = useMutation({
    mutationFn: (form: RegisterForm) => authApi.register(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created');
      setModalOpen(false);
      registerForm.reset({ role: 'CASHIER' });
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: (form: UpdateForm) => authApi.updateUser(editing!.userId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated');
      setEditModalOpen(false);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => authApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Register User
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
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Username</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Created</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data.data as User[]).map((u) => (
                <tr key={u.userId} className="border-b border-ui-card/50">
                  <td className="p-3">{u.fullName}</td>
                  <td className="p-3">{u.username}</td>
                  <td className="p-3">
                    <span className="rounded bg-brand-primary/20 px-2 py-1 text-sm capitalize text-brand-primary">{u.role.toLowerCase()}</span>
                  </td>
                  <td className="p-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="action-group">
                      <ActionIconButton
                        icon={Pencil}
                        title="Edit"
                        variant="warning"
                        onClick={() => {
                          setEditing(u);
                          updateForm.reset({ fullName: u.fullName, role: u.role });
                          setEditModalOpen(true);
                        }}
                      />
                      {u.userId !== currentUser?.userId && (
                        <ActionIconButton icon={Trash2} title="Delete" variant="danger" onClick={() => deleteMutation.mutate(u.userId)} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Register User">
        <form onSubmit={registerForm.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <div><label className="mb-1 block text-sm">Full Name</label><input {...registerForm.register('fullName')} className="input-field" /></div>
          <div><label className="mb-1 block text-sm">Username</label><input {...registerForm.register('username')} className="input-field" /></div>
          <div><label className="mb-1 block text-sm">Password</label><input type="password" {...registerForm.register('password')} className="input-field" /></div>
          <div>
            <label className="mb-1 block text-sm">Role</label>
            <select {...registerForm.register('role')} className="input-field">
              <option value="CASHIER">Cashier</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Register</button>
          </div>
        </form>
      </Modal>

      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit User">
        <form onSubmit={updateForm.handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
          <div><label className="mb-1 block text-sm">Full Name</label><input {...updateForm.register('fullName')} className="input-field" /></div>
          <div>
            <label className="mb-1 block text-sm">Role</label>
            <select {...updateForm.register('role')} className="input-field" disabled={editing?.userId === currentUser?.userId}>
              <option value="CASHIER">Cashier</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
