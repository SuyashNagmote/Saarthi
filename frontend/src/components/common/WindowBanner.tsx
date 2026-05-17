'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWindowStatus } from '@/lib/api/checkins';
import { WINDOW_LABELS } from '@/lib/utils/labels';
import { X } from 'lucide-react';

export function WindowBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['window-status'],
    queryFn: getWindowStatus,
    staleTime: 60_000,
  });

  if (isLoading || !data || dismissed) return null;

  const label = WINDOW_LABELS[data.windowType ?? ''] ?? data.windowType;
  const isGoalSetting = data.windowType === 'GOAL_SETTING';
  const isCheckIn =
    data.windowType === 'Q1_CHECKIN' ||
    data.windowType === 'Q2_CHECKIN' ||
    data.windowType === 'Q3_CHECKIN' ||
    data.windowType === 'Q4_FINAL';

  if (data.isOpen) {
    return (
      <div
        className="relative flex items-center gap-2 rounded-lg px-4 py-3 text-[13px] font-medium"
        style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}
      >
        <span className="h-2 w-2 shrink-0 rounded-full pulse-dot" style={{ background: 'currentColor' }} />
        <span className="flex-1">
          {isGoalSetting && (
            <>Goal setting window is open ({label}). You can create and submit goals.</>
          )}
          {isCheckIn && (
            <>Check-in window is open ({label}). Submit quarterly check-ins for your goals.</>
          )}
          {!isGoalSetting && !isCheckIn && (
            <><strong>{label}</strong> window is open.</>
          )}
        </span>
        <button type="button" className="opacity-70 hover:opacity-100" onClick={() => setDismissed(true)} aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center gap-2 rounded-lg px-4 py-3 text-[13px] font-medium"
      style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: 'currentColor' }} />
      <span className="flex-1">
        {isCheckIn ? 'Check-in window is closed.' : isGoalSetting ? 'Goal setting is closed.' : 'This window is closed.'}
        {data.nextOpenLabel && <> Next window opens in <strong>{data.nextOpenLabel}</strong>.</>}
      </span>
      <button type="button" className="opacity-70 hover:opacity-100" onClick={() => setDismissed(true)} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}
