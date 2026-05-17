'use client';

/**
 * TimelineView — Per-entity audit history, chronological event list per §7.2
 * "Click a goal, see every event chronologically with who did what and what changed" — §18.3
 */
export interface TimelineEvent {
  id: string;
  action: string;
  changerName: string;
  changerRole?: string;
  createdAt: string;
  diff?: Record<string, { from: unknown; to: unknown }>;
}

export function TimelineView({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-[14px] text-[var(--color-text-3)]">
        No history found for this entity.
      </p>
    );
  }

  return (
    <div className="relative space-y-4 pl-6 before:absolute before:bottom-0 before:left-[9px] before:top-2 before:w-[2px] before:bg-[var(--color-border)]">
      {events.map((event) => (
        <div key={event.id} className="relative">
          {/* Dot */}
          <div className="absolute -left-6 top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--color-surface)] shadow-[0_0_0_3px_var(--color-surface)]">
            <div className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
          </div>

          <div className="rounded-lg border border-[var(--color-border)] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[var(--color-text-1)]">
                {event.action.replace(/_/g, ' ')}
              </span>
              <span className="text-[11px] text-[var(--color-text-3)]">
                {new Date(event.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-0.5 text-[12px] text-[var(--color-text-2)]">
              by {event.changerName}
              {event.changerRole && (
                <span className="ml-1 text-[var(--color-text-3)]">({event.changerRole})</span>
              )}
            </p>

            {/* Diff — old → new values */}
            {event.diff && Object.keys(event.diff).length > 0 && (
              <div className="mt-2 rounded bg-[var(--color-surface-2)] p-2 font-mono text-[11px]">
                {Object.entries(event.diff).map(([key, val]) => (
                  <div key={key} className="mb-1 last:mb-0">
                    <span className="text-[var(--color-text-3)]">{key}: </span>
                    <span className="text-[var(--color-danger)]">{String(val.from)}</span>
                    {' → '}
                    <span className="text-[var(--color-success)]">{String(val.to)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
