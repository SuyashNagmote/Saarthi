'use client';

import { useCallback, useMemo, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { PageTransition } from '@/components/ui/PageTransition';
import {
  CommandPalette,
  useCommandPaletteShortcut,
} from '@/components/ui/CommandPalette';
import { DashboardChromeContext } from '@/components/layout/dashboard-chrome-context';
import type { AuthUser } from '@/lib/stores/auth.store';

export function DashboardChrome({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const openCommand = useCallback(() => setCommandOpen(true), []);
  useCommandPaletteShortcut(openCommand);

  const controls = useMemo(
    () => ({
      openMobileNav: () => setMobileNavOpen(true),
      openCommand: () => setCommandOpen(true),
    }),
    [],
  );

  return (
    <DashboardChromeContext.Provider value={controls}>
      <div className="flex min-h-screen bg-[var(--color-canvas)]">
        <Sidebar
          user={user}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />
        <main className="relative flex min-h-screen flex-1 flex-col overflow-auto">
          <AmbientBackground />
          <PageTransition>
            <div className="dashboard-canvas relative z-[1] flex min-h-full flex-1 flex-col">
              {children}
            </div>
          </PageTransition>
        </main>
        <CommandPalette user={user} open={commandOpen} onOpenChange={setCommandOpen} />
      </div>
    </DashboardChromeContext.Provider>
  );
}
