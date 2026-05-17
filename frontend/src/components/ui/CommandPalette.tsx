'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, ArrowRight } from 'lucide-react';
import type { AuthUser } from '@/lib/stores/auth.store';
import { NAV_BY_ROLE } from '@/lib/navigation';

type CommandPaletteProps = {
  user: AuthUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ user, open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const items = NAV_BY_ROLE[user.role];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q) ||
        item.keywords?.toLowerCase().includes(q),
    );
  }, [items, query]);

  const navigate = useCallback(
    (href: string) => {
      onOpenChange(false);
      setQuery('');
      router.push(href);
    },
    [onOpenChange, router],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close command menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command menu"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[12%] z-[201] w-[min(520px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
              <Search size={18} className="shrink-0 text-[var(--color-text-3)]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to a page…"
                className="flex-1 bg-transparent text-[15px] text-[var(--color-text-1)] outline-none placeholder:text-[var(--color-text-3)]"
              />
              <kbd className="hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-3)] sm:inline">
                esc
              </kbd>
            </div>
            <ul className="max-h-[320px] overflow-auto p-2">
              {filtered.length === 0 ? (
                <li className="px-3 py-8 text-center text-[13px] text-[var(--color-text-2)]">
                  No matches for &ldquo;{query}&rdquo;
                </li>
              ) : (
                filtered.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <button
                        type="button"
                        onClick={() => navigate(item.href)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] text-[var(--color-text-2)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-1)]"
                      >
                        <Icon size={16} className="shrink-0 text-[var(--color-accent)]" />
                        <span className="flex-1 font-medium">{item.label}</span>
                        <ArrowRight size={14} className="opacity-40" />
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Registers ⌘K / Ctrl+K globally */
export function useCommandPaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpen]);
}
