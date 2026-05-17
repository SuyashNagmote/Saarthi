'use client';

/**
 * SelfVsManagerScore — Side-by-side self vs manager rating with delta highlight per §7.2
 * The delta (manager_rating - self_rating) is a critical calibration insight per §6.5.
 */
export function SelfVsManagerScore({
  selfRating,
  managerRating,
  employeeName,
}: {
  selfRating: number;
  managerRating: number;
  employeeName?: string;
}) {
  const delta = managerRating - selfRating;

  const deltaColor =
    delta === 0
      ? 'var(--color-text-2)'
      : delta > 0
        ? 'var(--color-success)'
        : 'var(--color-danger)';

  const deltaLabel =
    delta === 0 ? 'Aligned' : delta > 0 ? `+${delta} (Higher)` : `${delta} (Lower)`;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {employeeName && (
        <p className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--color-text-1)]">
          {employeeName}
        </p>
      )}
      <div className="flex items-center gap-3">
        {/* Self Rating */}
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-3)]">Self</p>
          <p className="text-[18px] font-bold text-[var(--color-text-1)]">{selfRating}</p>
        </div>

        <span className="text-[var(--color-text-3)]">vs</span>

        {/* Manager Rating */}
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-3)]">Manager</p>
          <p className="text-[18px] font-bold text-[var(--color-text-1)]">{managerRating}</p>
        </div>

        {/* Delta */}
        <span
          className="ml-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
          style={{ background: `${deltaColor}15`, color: deltaColor }}
        >
          {deltaLabel}
        </span>
      </div>
    </div>
  );
}
