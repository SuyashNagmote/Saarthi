'use client';

import { useEscapeKey } from '@/lib/hooks/useEscapeKey';

/**
 * ConflictModal — Non-dismissible modal for 409 Optimistic Lock Conflict per §6.8
 * "On 409 show non-dismissible modal with [Reload Goal] button."
 * "Auto-refresh the approval queue after dismiss."
 * "Never let stale data silently overwrite."
 */
export function ConflictModal({
  isOpen,
  onReload,
}: {
  isOpen: boolean;
  onReload: () => void;
}) {
  useEscapeKey(isOpen, onReload);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-warning-bg)]">
          <span className="text-[24px]">⚠️</span>
        </div>
        <h3 className="text-[16px] font-semibold text-[var(--color-text-1)]">
          Conflict Detected
        </h3>
        <p className="mt-2 text-[14px] text-[var(--color-text-2)]">
          This goal was updated by someone else. Reload to see the latest.
        </p>
        <button
          type="button"
          className="btn-primary mt-6 w-full"
          onClick={onReload}
        >
          Reload Goal
        </button>
      </div>
    </div>
  );
}
