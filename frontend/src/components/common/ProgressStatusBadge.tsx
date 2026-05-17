'use client';

import { PROGRESS_STATUS_LABELS, toLabel } from '@/lib/utils/labels';

const STYLES: Record<string, { bg: string; color: string }> = {
  NOT_STARTED: { bg: 'var(--color-surface-2)', color: 'var(--color-text-2)' },
  ON_TRACK: { bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
  AT_RISK: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
  COMPLETED: { bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
  MISSED: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)' },
};

export function ProgressStatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? { bg: 'var(--color-surface-2)', color: 'var(--color-text-2)' };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide"
      style={{ background: style.bg, color: style.color }}
    >
      {PROGRESS_STATUS_LABELS[status] ?? toLabel(status)}
    </span>
  );
}
