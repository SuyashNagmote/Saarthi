'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth.store';
import { NotificationBell } from './NotificationBell';
import { LogOut, Menu, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getActiveCycle } from '@/lib/api/cycles';
import { useDashboardChrome } from '@/components/layout/dashboard-chrome-context';

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const chrome = useDashboardChrome();
  const { data: cycleData } = useQuery({
    queryKey: ['active-cycle'],
    queryFn: getActiveCycle,
    staleTime: 5 * 60 * 1000,
  });
  const cycleName = cycleData?.cycle?.name ?? 'FY 2025-26';

  return (
    <header
      className="sticky top-0 z-50 flex h-[64px] items-center justify-between border-b border-[var(--color-border)] px-4 md:px-8"
      style={{
        background: 'rgba(12, 12, 14, 0.85)',
        backdropFilter: 'saturate(200%) blur(24px)',
        WebkitBackdropFilter: 'saturate(200%) blur(24px)',
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => chrome?.openMobileNav()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-2)] transition-colors hover:text-[var(--color-text-1)] lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="truncate text-[18px] font-semibold tracking-[-0.03em] text-[var(--color-text-1)]">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-[12px] text-[var(--color-text-2)]">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => chrome?.openCommand()}
          className="hidden h-9 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-[12px] text-[var(--color-text-3)] transition-colors hover:border-[var(--color-border-2)] hover:text-[var(--color-text-2)] sm:flex"
          aria-label="Open command menu"
        >
          <Search size={14} />
          <span>Search</span>
          <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1 py-0.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </button>

        <div className="hidden items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 shadow-sm transition-colors hover:border-[var(--color-border-2)] sm:flex">
          <span
            className="h-[6px] w-[6px] rounded-full"
            style={{
              background: 'var(--color-success)',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
            }}
          />
          <span className="max-w-[140px] truncate text-[12px] font-semibold text-[var(--color-text-2)]">
            {cycleName}
          </span>
        </div>

        <NotificationBell />

        <div className="ml-1 flex items-center gap-2">
          {user && (
            <Link
              href="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
              }}
              title="Profile"
            >
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </Link>
          )}
          <button
            type="button"
            onClick={() => logout().then(() => (window.location.href = '/login'))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-3)] transition-all hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-1)]"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
