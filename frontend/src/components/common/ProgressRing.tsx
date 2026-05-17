'use client';

/**
 * ProgressRing — Circular progress indicator per §7.2
 * Color: green ≥ 90, amber 70-89, red < 70
 */
export function ProgressRing({
  value,
  size = 48,
  strokeWidth = 4,
  label,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (clamped / 100) * circumference;

  const color =
    clamped >= 90
      ? 'var(--color-success)'
      : clamped >= 70
        ? 'var(--color-warning)'
        : 'var(--color-danger)';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span
        className="absolute text-center font-semibold"
        style={{ fontSize: size * 0.22, color }}
      >
        {label ?? `${Math.round(clamped)}`}
      </span>
    </div>
  );
}
