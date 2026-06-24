import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authApi } from '../api';
import { useAuthStore, useThemeStore } from '../store';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { darkMode, toggleDarkMode } = useThemeStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authApi.changePassword(data.currentPassword, data.newPassword);
      toast.success('Password changed successfully');
      reset();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to change password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="card">
        <h3 className="font-semibold mb-4">Profile</h3>
        <div className="space-y-2 text-sm">
          <p><span className="text-brand-deep/70">Name:</span> {user?.fullName}</p>
          <p><span className="text-brand-deep/70">Username:</span> {user?.username}</p>
          <p><span className="text-brand-deep/70">Role:</span> <span className="capitalize">{user?.role?.toLowerCase()}</span></p>
        </div>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-4">Appearance</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} className="w-4 h-4" />
          <span>Dark Mode</span>
        </label>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-4">Change Password</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Current Password</label>
            <input type="password" {...register('currentPassword')} className="input-field" />
            {errors.currentPassword && <p className="text-accent-danger text-sm">{errors.currentPassword.message}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">New Password</label>
            <input type="password" {...register('newPassword')} className="input-field" />
            {errors.newPassword && <p className="text-accent-danger text-sm">{errors.newPassword.message}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Confirm Password</label>
            <input type="password" {...register('confirmPassword')} className="input-field" />
            {errors.confirmPassword && <p className="text-accent-danger text-sm">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Change Password'}</button>
        </form>
      </div>
    </div>
  );
}
