/**
 * Central label mapping — never show raw enum values to users.
 * Import this wherever backend enum strings are displayed.
 */

export const UOM_LABELS: Record<string, string> = {
  NUMERIC: 'Number',
  PERCENTAGE: '%',
  TIMELINE: 'Date',
  ZERO_BASED: 'Zero-based',
};

export const GOAL_TYPE_LABELS: Record<string, string> = {
  MIN_TYPE: 'Higher is better',
  MAX_TYPE: 'Lower is better',
  TIMELINE: 'Timeline',
  ZERO_BASED: 'Zero incidents',
};

export const GOAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_APPROVAL: 'Pending approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REWORK_REQUESTED: 'Needs rework',
  LOCKED: 'Locked',
  CYCLE_CLOSED: 'Cycle closed',
};

export const PROGRESS_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Not started',
  ON_TRACK: 'On track',
  AT_RISK: 'At risk',
  COMPLETED: 'Completed',
  MISSED: 'Missed',
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  APPROVAL_PENDING: 'Approval pending',
  APPROVAL_APPROVED: 'Goal approved',
  APPROVAL_REJECTED: 'Goal rejected',
  REWORK_REQUESTED: 'Rework requested',
  CHECKIN_REMINDER: 'Check-in reminder',
  GOAL_LOCKED: 'Goal locked',
  ESCALATION: 'Escalation',
};

export const QUARTER_LABELS: Record<string, string> = {
  Q1: 'Q1',
  Q2: 'Q2',
  Q3: 'Q3',
  Q4: 'Q4',
  ANNUAL: 'Annual',
};

export const CYCLE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  CLOSED: 'Closed',
  UPCOMING: 'Upcoming',
  DRAFT: 'Draft',
};

export const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: 'Employee',
  MANAGER: 'Manager',
  ADMIN: 'Administrator',
};

export const WINDOW_LABELS: Record<string, string> = {
  GOAL_SETTING: 'Goal setting (April–May)',
  Q1_CHECKIN: 'Q1 check-in (June–July)',
  Q2_CHECKIN: 'Q2 check-in (September–October)',
  Q3_CHECKIN: 'Q3 check-in (January–February)',
  Q4_FINAL: 'Q4 final review (March–April)',
};

/** Human-readable target with UoM */
export function formatTarget(value: number, uomType: string): string {
  if (uomType === 'PERCENTAGE') return `${value}%`;
  if (uomType === 'ZERO_BASED') return '0 incidents';
  return `${formatNumber(value)} · ${UOM_LABELS[uomType] ?? toLabel(uomType)}`;
}

/** Display score capped at 100 for UI */
export function formatScoreDisplay(score: number | null | undefined): string {
  if (score == null) return '—';
  return String(Math.min(100, Math.round(score)));
}

export function formatRole(role: string): string {
  return ROLE_LABELS[role] ?? toLabel(role);
}

/** Generic fallback: converts SNAKE_CASE to Sentence case */
export function toLabel(value: string | null | undefined): string {
  if (!value) return '—';
  // Check known maps first
  const maps = [
    UOM_LABELS,
    GOAL_TYPE_LABELS,
    GOAL_STATUS_LABELS,
    PROGRESS_STATUS_LABELS,
    NOTIFICATION_TYPE_LABELS,
    QUARTER_LABELS,
    CYCLE_STATUS_LABELS,
  ];
  for (const map of maps) {
    if (value in map) return map[value]!;
  }
  // Fallback: SNAKE_CASE → Sentence case
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

/** Format a number with compact notation: 1200000 → "1.2M" */
export function formatNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

/** Safe date formatter — never shows "Invalid Date" */
export function formatDate(value: string | null | undefined, locale = 'en-IN'): string {
  if (!value) return 'Not set';
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'Not set';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/** Clamp a percentage to 0–100 */
export function clampPct(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Signed in',
  CREATED: 'Created',
  UPDATED: 'Updated',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REWORK_REQUESTED: 'Rework requested',
  MANAGER_EDITED: 'Manager edited',
  LOCKED: 'Locked',
  DELETED: 'Deleted',
  PASSWORD_CHANGED: 'Password changed',
  CYCLE_ACTIVATED: 'Cycle activated',
};

export function formatAuditAction(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? toLabel(action);
}

export function formatIpAddress(ip: string | null | undefined): string {
  if (!ip || ip === '::1' || ip === '127.0.0.1') return 'Local demo';
  return ip;
}

export function ratingFromScore(score: number): { rating: number; label: string } {
  if (score >= 110) return { rating: 5, label: 'Exceptional' };
  if (score >= 90) return { rating: 4, label: 'Exceeds Expectations' };
  if (score >= 70) return { rating: 3, label: 'Meets Expectations' };
  if (score >= 50) return { rating: 2, label: 'Needs Improvement' };
  return { rating: 1, label: 'Unsatisfactory' };
}
