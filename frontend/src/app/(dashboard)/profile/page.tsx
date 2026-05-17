'use client';

import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { TopBar } from '@/components/layout/TopBar';
import { changePassword } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/auth.store';
import { Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsSaving(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <TopBar title="Profile" />
      <div className="grid gap-6 p-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="card p-6">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-[18px] font-bold text-white">
            {user?.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
          </div>
          <h2 className="text-[18px] font-semibold">{user?.name}</h2>
          <p className="text-[14px] text-[var(--color-text-2)]">{user?.email}</p>
          <div className="divider" />
          <dl className="space-y-3 text-[14px]">
            <div>
              <dt className="text-[11px] text-[var(--color-text-3)]">Role</dt>
              <dd className="font-medium">{user?.role}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-[var(--color-text-3)]">Department</dt>
              <dd className="font-medium">{user?.department}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-[var(--color-text-3)]">Designation</dt>
              <dd className="font-medium">{user?.designation}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[12px] text-[var(--color-text-3)]">
            Profile fields are managed by your administrator.
          </p>
        </section>

        <section className="card p-6">
          <h2 className="section-title">Security</h2>
          <form className="max-w-md space-y-4" onSubmit={handleSubmit}>
            <PasswordField
              id="current-password"
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
            />
            <PasswordField
              id="new-password"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
              minLength={8}
            />
            <PasswordField
              id="confirm-password"
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              minLength={8}
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[13px] text-[var(--color-danger)]">Passwords do not match</p>
            )}
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Update password'}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  minLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  minLength?: number;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          id={id}
          className="input pr-10"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={minLength}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-3)]"
          onClick={onToggle}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
