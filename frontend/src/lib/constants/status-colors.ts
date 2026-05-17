/**
 * Status badge styles — dark-theme aware.
 * bg/text use CSS variables so they adapt to the dark canvas.
 */
export const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  DRAFT:            { bg: 'rgba(148,163,184,0.12)', text: '#94A3B8', label: 'Draft' },
  SUBMITTED:        { bg: 'rgba(59,130,246,0.14)',  text: '#60A5FA', label: 'Submitted' },
  PENDING_APPROVAL: { bg: 'rgba(245,158,11,0.14)',  text: '#FCD34D', label: 'Pending' },
  APPROVED:         { bg: 'rgba(34,197,94,0.14)',   text: '#4ADE80', label: 'Approved' },
  REJECTED:         { bg: 'rgba(239,68,68,0.14)',   text: '#F87171', label: 'Rejected' },
  REWORK_REQUESTED: { bg: 'rgba(239,68,68,0.14)',   text: '#F87171', label: 'Rework' },
  LOCKED:           { bg: 'rgba(139,92,246,0.14)',  text: '#A78BFA', label: 'Locked' },
  CYCLE_CLOSED:     { bg: 'rgba(100,116,139,0.14)', text: '#94A3B8', label: 'Closed' },
};

export const CATEGORY_COLORS: Record<string, string> = {
  Strategic:   '#6366F1',
  Operational: '#F59E0B',
  Development: '#0D9488',
};
