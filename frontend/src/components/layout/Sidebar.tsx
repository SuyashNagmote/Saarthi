'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AuthUser } from '@/lib/stores/auth.store';
import { apiFetch } from '@/lib/api/client';
import { formatRole } from '@/lib/utils/labels';
import { NAV_BY_ROLE } from '@/lib/navigation';
import { X } from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  EMPLOYEE: '#059669',
  MANAGER: '#4f46e5',
  ADMIN: '#7c3aed',
};

type SidebarProps = {
  user: AuthUser;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function Sidebar({ user, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[user.role];
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user.role !== 'MANAGER') return;
    const fetchCount = async () => {
      try {
        const data = await apiFetch<{ total: number }>('/approvals?limit=1');
        setPendingCount(data.total ?? 0);
      } catch {
        /* ignore */
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, [user.role]);

  const nav = (
  <>
    <div className="relative z-10 flex h-[64px] items-center justify-between gap-3 px-6">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%)',
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
          }}
        >
          S
        </div>
        <div>
          <span className="text-[16px] font-semibold tracking-[-0.03em] text-[var(--color-text-1)]">
            Saarthi
          </span>
          <p className="text-[11px] font-medium text-[var(--color-text-2)]">TechCorp</p>
        </div>
      </div>
      {onMobileClose && (
        <button
          type="button"
          onClick={onMobileClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-3)] hover:bg-[var(--color-surface-2)] lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      )}
    </div>

    <nav className="relative z-10 flex-1 overflow-auto px-3 pt-2 pb-4">
      {items.map((item, index) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <div key={item.href}>
            {item.section && (
              <p
                className={`${index > 0 ? 'mt-5' : 'mt-2'} mb-1 px-3 text-[11px] font-medium tracking-[0.04em] text-[var(--color-text-2)]`}
              >
                {item.section}
              </p>
            )}
            <Link
              href={item.href}
              onClick={onMobileClose}
              className="group relative flex h-[40px] items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition-all"
              style={{
                background: active ? 'var(--color-accent-dim)' : undefined,
                color: active ? 'var(--color-accent)' : 'var(--color-text-2)',
              }}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
                  style={{ background: 'var(--color-accent)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                size={18}
                strokeWidth={active ? 2.2 : 1.8}
                className="shrink-0 transition-colors group-hover:text-[var(--color-accent)]"
              />
              <span className="flex-1 transition-colors group-hover:text-[var(--color-text-1)]">
                {item.label}
              </span>
              {item.href === '/approvals' && pendingCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-accent)] px-1.5 text-[10px] font-bold text-white">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </Link>
          </div>
        );
      })}
    </nav>

    <div className="relative z-10 p-4">
      <div className="flex items-center gap-3 rounded-xl border border-transparent p-2 transition-all duration-200 hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)] hover:shadow-sm">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold text-white"
          style={{
            background: ROLE_COLORS[user.role] ?? '#64748b',
            boxShadow: `0 2px 6px ${ROLE_COLORS[user.role] ?? '#64748b'}40`,
          }}
        >
          {user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[var(--color-text-1)]">{user.name}</p>
          <p className="truncate text-[11px] text-[var(--color-text-3)]">{user.designation}</p>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em]"
          style={{
            background: `${ROLE_COLORS[user.role] ?? '#64748b'}15`,
            color: ROLE_COLORS[user.role] ?? '#64748b',
          }}
        >
          {formatRole(user.role)}
        </span>
      </div>
    </div>
  </>
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            type="button"
            aria-label="Close navigation overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-[2px] lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={[
          'fixed inset-y-0 left-0 z-[95] flex h-screen w-[260px] shrink-0 flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:static lg:z-auto lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <div
          className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
          style={{
            backgroundImage: 'radial-gradient(var(--color-text-1) 1px, transparent 0)',
            backgroundSize: '16px 16px',
          }}
        />
        {nav}
      </aside>
    </>
  );
}
