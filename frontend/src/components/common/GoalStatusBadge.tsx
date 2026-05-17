import { STATUS_STYLES } from '@/lib/constants/status-colors';

export function GoalStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT!;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.04em]"
      style={{ background: style.bg, color: style.text }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full opacity-70"
        style={{ background: 'currentColor' }}
      />
      {style.label}
    </span>
  );
}
