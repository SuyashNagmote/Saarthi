'use client';

/**
 * ScoreBadge — Numeric score with color coding (green/amber/red) per §7.2
 */
export function ScoreBadge({ score, max = 100 }: { score: number; max?: number }) {
  const color =
    score >= 85
      ? 'var(--color-success)'
      : score >= 70
        ? 'var(--color-warning)'
        : 'var(--color-danger)';

  const bg =
    score >= 85
      ? 'var(--color-success-bg)'
      : score >= 70
        ? 'var(--color-warning-bg)'
        : 'var(--color-danger-bg)';

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-bold tabular-nums"
      style={{ background: bg, color }}
    >
      {Math.round(score)}
      <span className="font-normal opacity-60">/ {max}</span>
    </span>
  );
}
