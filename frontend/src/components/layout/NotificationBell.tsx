'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { useNotificationStore } from '@/lib/stores/notification.store';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';

/**
 * NotificationBell — §9 In-App Notification Component
 * - Bell icon in topbar — red badge (1-9), 9+ for more
 * - Dropdown last 10 notifications, newest first
 * - Click → navigate to action_url
 * - Mark all read in dropdown header
 */
export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    startPolling,
  } = useNotificationStore();

  useEscapeKey(isOpen, () => setIsOpen(false));

  useEffect(() => {
    const cleanup = startPolling();
    return cleanup;
  }, [startPolling]);

  return (
    <div className="relative">
      <button
        type="button"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-1)] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div
            role="dialog"
            aria-modal="true"
            className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <h3 className="text-[14px] font-semibold text-[var(--color-text-1)]">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="text-[12px] font-medium text-[var(--color-accent)] hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-[13px] text-[var(--color-text-3)]">
                  No notifications yet.
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      markRead(n.id);
                      if (n.action_url) router.push(n.action_url);
                      setIsOpen(false);
                    }}
                    className={`flex w-full cursor-pointer flex-col gap-1 border-b border-[var(--color-border)] p-4 text-left transition-colors hover:bg-[var(--color-surface-2)] ${
                      !n.is_read ? 'bg-[var(--color-accent-dim)]' : ''
                    }`}
                  >
                    <span className="text-[13px] font-medium text-[var(--color-text-1)]">
                      {n.title}
                    </span>
                    <span className="text-[12px] text-[var(--color-text-2)]">{n.message}</span>
                    <span className="text-[11px] text-[var(--color-text-3)]">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </button>
                ))
              )}
            </div>
            {/* Full page link */}
            <div className="border-t border-[var(--color-border)] p-2 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/notifications');
                }}
                className="w-full rounded-lg py-2 text-[12px] font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-surface-2)]"
              >
                View all notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
