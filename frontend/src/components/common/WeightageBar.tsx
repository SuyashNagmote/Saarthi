'use client';

import { motion } from 'framer-motion';
import { CATEGORY_COLORS } from '@/lib/constants/status-colors';
import { GOAL_RULES } from '@/lib/constants/goal-rules';

interface Segment {
  id: string;
  title: string;
  weightage: number;
  category: string;
}

export function WeightageBar({
  segments,
  currentWeightage,
  currentCategory,
  currentTitle,
}: {
  segments: Segment[];
  currentWeightage?: number;
  currentCategory?: string;
  currentTitle?: string;
}) {
  const displaySegments = [...segments];
  if (currentWeightage && currentWeightage > 0 && currentTitle) {
    const exists = displaySegments.some((s) => s.title === currentTitle);
    if (!exists) {
      displaySegments.push({
        id: '__current__',
        title: currentTitle,
        weightage: currentWeightage,
        category: currentCategory ?? 'Operational',
      });
    }
  }

  const total = displaySegments.reduce((s, g) => s + g.weightage, 0);
  const remaining = GOAL_RULES.TOTAL_WEIGHTAGE - total;
  const isComplete = total === GOAL_RULES.TOTAL_WEIGHTAGE;
  const isOver = total > GOAL_RULES.TOTAL_WEIGHTAGE;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-[12px]">
        <span className="font-medium text-[var(--color-text-2)]">Allocated</span>
        <span
          className="font-mono font-semibold"
          style={{ color: isOver ? 'var(--color-danger)' : isComplete ? 'var(--color-success)' : 'var(--color-text-1)' }}
        >
          {total} / {GOAL_RULES.TOTAL_WEIGHTAGE}%
        </span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-[var(--color-surface-2)] ring-1 ring-[var(--color-border)]">
        {displaySegments.map((seg) => (
          <motion.div
            key={seg.id}
            layout
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="h-full origin-left border-r border-white/70"
            style={{
              width: `${Math.max(0, Math.min(seg.weightage, 100))}%`,
              background: CATEGORY_COLORS[seg.category] ?? '#94a3b8',
            }}
            title={`${seg.title}: ${seg.weightage}%`}
          />
        ))}
        {remaining > 0 && (
          <div
            className="h-full flex-1 border border-dashed border-[var(--color-border-2)]"
            style={{ minWidth: `${remaining}%` }}
          />
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {displaySegments.map((seg) => (
          <span key={`${seg.id}-legend`} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-2 py-1 text-[11px] text-[var(--color-text-2)]">
            <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLORS[seg.category] ?? '#94a3b8' }} />
            {seg.title}: <span className="font-mono">{seg.weightage}%</span>
          </span>
        ))}
      </div>
      <p className="mt-2 text-[13px] text-[var(--color-text-3)]">
        {isOver ? (
          <span className="text-[var(--color-danger)]">{Math.abs(remaining)}% over allocation</span>
        ) : isComplete ? (
          <span className="text-[var(--color-success)]">✓ 100% allocated</span>
        ) : (
          <>
            <span className="font-mono">{remaining}%</span> remaining
            {total !== 0 && (
              <>
                {' '}
                · total <span className="font-mono">{total}%</span>
              </>
            )}
          </>
        )}
      </p>
    </div>
  );
}
