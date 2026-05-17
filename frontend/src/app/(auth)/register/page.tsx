'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiFetch } from '@/lib/api/client';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']),
  manager_id: z.string().optional(),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [managers, setManagers] = useState<{ id: string; name: string; department: string }[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirm_password: '',
      department: '',
      designation: '',
      role: 'EMPLOYEE',
      manager_id: '',
    },
  });

  const role = form.watch('role');

  useEffect(() => {
    apiFetch<{ managers: { id: string; name: string; department: string }[] }>('/auth/managers').then((res) => {
      setManagers(res?.managers || []);
    }).catch(console.error);
  }, []);

  async function onSubmit(data: RegisterForm) {
    try {
      setError('');
      await apiFetch<unknown>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      router.push('/login');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Registration failed');
      } else {
        setError('Registration failed');
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-6">
      <div className="w-full max-w-[440px]">
      <div className="mb-8 text-center">
        <h1 className="text-[28px] font-semibold text-[var(--color-text-1)]">Create an account</h1>
        <p className="mt-2 text-[14px] text-[var(--color-text-2)]">
          Join Saarthi to start managing your goals
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-[var(--color-danger)]/10 p-3 text-center text-[13px] text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-2)]">Name</label>
          <input type="text" className="input" {...form.register('name')} />
          {form.formState.errors.name && <p className="mt-1 text-xs text-[var(--color-danger)]">{form.formState.errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-2)]">Email address</label>
          <input type="email" className="input" {...form.register('email')} />
          {form.formState.errors.email && <p className="mt-1 text-xs text-[var(--color-danger)]">{form.formState.errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-2)]">Password</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} className="input pr-10" {...form.register('password')} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-3)]" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {form.formState.errors.password && <p className="mt-1 text-xs text-[var(--color-danger)]">{form.formState.errors.password.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-2)]">Confirm password</label>
          <div className="relative">
            <input type={showConfirm ? 'text' : 'password'} className="input pr-10" {...form.register('confirm_password')} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-3)]" onClick={() => setShowConfirm((v) => !v)}>
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {form.formState.errors.confirm_password && <p className="mt-1 text-xs text-[var(--color-danger)]">{form.formState.errors.confirm_password.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-2)]">Department</label>
            <input type="text" className="input" {...form.register('department')} />
            {form.formState.errors.department && <p className="mt-1 text-xs text-[var(--color-danger)]">{form.formState.errors.department.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-2)]">Designation</label>
            <input type="text" className="input" {...form.register('designation')} />
            {form.formState.errors.designation && <p className="mt-1 text-xs text-[var(--color-danger)]">{form.formState.errors.designation.message}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-2)]">Role</label>
          <select className="input" {...form.register('role')}>
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {(role === 'EMPLOYEE' || role === 'MANAGER') && (
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-2)]">Reporting Manager</label>
            <select className="input" {...form.register('manager_id')}>
              <option value="">Select a manager...</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.department})</option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          className="btn-primary mt-2 w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Register'}
        </button>
      </form>
      
      <div className="mt-6 text-center text-[13px] text-[var(--color-text-2)]">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[var(--color-accent)] hover:underline">
          Sign in
        </Link>
      </div>
      </div>
    </div>
  );
}
