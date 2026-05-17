/**
 * Date utilities per §15 — using date-fns patterns but with native Date
 * to avoid adding unnecessary dependency.
 */

export function formatShortDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelative(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatShortDate(date);
}

export function isWithinDays(date: string | Date, days: number): boolean {
  const target = new Date(date).getTime();
  const now = Date.now();
  return target - now <= days * 86400000 && target >= now;
}

export function daysUntil(date: string | Date): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}
