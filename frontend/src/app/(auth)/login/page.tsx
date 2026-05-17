'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '@/lib/msal-config';
import { useAuthStore } from '@/lib/stores/auth.store';
import { Fingerprint, Activity, AlertCircle, Eye, EyeOff } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Employee', email: 'arjun@techcorp.com', password: 'Employee@123' },
  { label: 'Manager', email: 'raj@techcorp.com', password: 'Manager@123' },
  { label: 'Admin', email: 'sarah@techcorp.com', password: 'Admin@123' },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('arjun@techcorp.com');
  const [password, setPassword] = useState('Employee@123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { instance } = useMsal();
  const loginAzure = useAuthStore((s) => s.loginAzure);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(account: (typeof DEMO_ACCOUNTS)[0]) {
    setEmail(account.email);
    setPassword(account.password);
  }

  async function handleMicrosoftLogin() {
    setError(null);
    setLoading(true);
    try {
      const response = await instance.loginPopup(loginRequest);
      if (response && response.accessToken) {
        await loginAzure(response.accessToken);
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('MSAL Login Error:', err);
      setError('Microsoft login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--color-canvas)]">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 0), radial-gradient(circle at 18% 20%, rgba(201,168,76,0.12), transparent 18%), radial-gradient(circle at 82% 15%, rgba(111,127,248,0.08), transparent 14%)',
          backgroundSize: '24px 24px, 380px 380px, 300px 300px',
          maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
        }}
      />

      {/* Ambient glow */}
      <motion.div
        animate={{ opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-1/2 top-0 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-[160px] pointer-events-none"
        style={{ background: 'var(--color-accent)', opacity: 0.15 }}
      />

      <div className="relative z-10 w-full max-w-[440px] px-6">

        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 flex flex-col items-center text-center"
        >
          <div
            className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-border)] shadow-lg"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-accent)' }}
          >
            <Activity size={28} strokeWidth={2.5} />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-1)]">
            Welcome to Saarthi
          </h1>
          <p className="mt-2 text-[15px] font-medium text-[var(--color-text-2)]">
            Enter your credentials to access the platform.
          </p>
        </motion.div>

        {/* Main Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel rounded-[24px] p-8 border border-[var(--color-border)]"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-[13px] font-semibold text-[var(--color-text-2)]">
                Email Address
              </label>
              <input
                id="email"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-[15px] text-[var(--color-text-1)] transition-all placeholder:text-[var(--color-text-3)] hover:border-[var(--color-border-2)] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="name@company.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[13px] font-semibold text-[var(--color-text-2)]">
                  Password
                </label>
                <a href="#" className="text-[13px] text-[var(--color-text-2)] underline-offset-2 hover:underline">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 pr-11 text-[15px] text-[var(--color-text-1)] transition-all placeholder:text-[var(--color-text-3)] hover:border-[var(--color-border-2)] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-3)] hover:text-[var(--color-text-2)]"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 rounded-xl p-3 text-[13px] font-medium"
                style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}
              >
                <AlertCircle size={16} /> {error}
              </motion.div>
            )}

            <button
              type="submit"
              className="group relative mt-2 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-[15px] font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 disabled:opacity-50"
              style={{ background: 'var(--color-accent)' }}
              disabled={loading}
            >
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                <div className="relative h-full w-8 bg-white/20" />
              </div>
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>Sign In</>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative mt-6 py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border)]" />
            </div>
            <div className="relative flex justify-center">
              <span
                className="px-4 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-3)]"
                style={{ background: 'var(--color-surface)' }}
              >
                or continue with
              </span>
            </div>
          </div>

          {/* Microsoft SSO */}
          <button
            type="button"
            onClick={handleMicrosoftLogin}
            disabled={loading}
            className="mt-4 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[14px] font-semibold text-[var(--color-text-1)] transition-all hover:border-[var(--color-border-2)] hover:bg-[var(--color-surface-elevated)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            Sign in with Microsoft
          </button>

          {/* Demo accounts */}
          <div className="relative mt-8 py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border)]" />
            </div>
            <div className="relative flex justify-center">
              <span
                className="px-4 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-3)]"
                style={{ background: 'var(--color-surface)' }}
              >
                Quick Access Demo
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-[var(--color-border)] p-3">
          <div className="flex gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => fillDemo(a)}
                className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] py-3 text-[var(--color-text-2)] transition-all hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-dim)] hover:text-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
              >
                <Fingerprint size={18} className="opacity-70" />
                <span className="text-[12px] font-semibold">{a.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-[11px] text-[var(--color-text-3)]">Demo only — not for production use</p>
          </div>
        </motion.div>

        <p className="mt-8 text-center text-[13px] font-medium text-[var(--color-text-3)]">
          Enterprise performance management for TechCorp
        </p>
      </div>
    </div>
  );
}
