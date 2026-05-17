'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardChrome } from '@/components/layout/DashboardChrome';
import { useAuthStore } from '@/lib/stores/auth.store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, hydrate } = useAuthStore();

  useEffect(() => {
    if (useAuthStore.getState().user) {
      useAuthStore.setState({ isLoading: false });
      return;
    }
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen bg-[var(--color-canvas)]">
        <div className="flex h-screen w-[260px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex h-[64px] items-center gap-3 px-6">
            <div className="h-9 w-9 rounded-xl skeleton" />
            <div className="h-4 w-20 rounded skeleton" />
          </div>
          <div className="flex-1 space-y-1 px-3 pt-6">
            <div className="mb-3 mx-3 h-3 w-16 rounded skeleton" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 rounded-lg skeleton" />
            ))}
          </div>
        </div>
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="h-[64px] shrink-0 border-b border-[var(--color-border)] skeleton" />
          <div className="flex-1 space-y-4 overflow-auto p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[110px] rounded-[var(--radius-lg)] skeleton" />
              ))}
            </div>
            <div className="h-80 rounded-[var(--radius-lg)] skeleton" />
          </div>
        </main>
      </div>
    );
  }

  return <DashboardChrome user={user}>{children}</DashboardChrome>;
}
