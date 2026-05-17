'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { DataTable } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { useNotifications } from '@/lib/hooks/useNotifications';
import type { Notification } from '@/lib/stores/notification.store';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, NOTIFICATION_TYPE_LABELS } from '@/lib/utils/labels';

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, fetch, markRead, markAllRead, isLoading } = useNotifications();

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <>
      <TopBar title={`Notifications${notifications.length ? ` (${notifications.length})` : ''}`} />
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="kpi-card w-full max-w-xs">
            <p className="kpi-label">Unread</p>
            <p className="kpi-value">{unreadCount}</p>
            <p className="kpi-sub">Notifications pending</p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                markAllRead();
                toast.success('All notifications marked as read.');
              }}
            >
              Mark all read
            </button>
          )}
        </div>

        {isLoading && <div className="card h-72 skeleton" />}

        {!isLoading && (
          <DataTable<Notification>
            data={notifications}
            getRowKey={(row) => row.id}
            onRowClick={(row) => {
              markRead(row.id);
              if (row.action_url) router.push(row.action_url);
            }}
            empty={
              <div className="card mx-auto max-w-md">
                <EmptyState
                  icon={<Bell size={24} />}
                  title="No notifications"
                  description="Approval updates and reminders will land here."
                />
              </div>
            }
            columns={[
              { key: 'title', header: 'Title', cell: (row) => <span className={!row.is_read ? 'font-semibold' : ''}>{row.title}</span> },
              { key: 'message', header: 'Message', cell: (row) => row.message },
              { key: 'type', header: 'Type', cell: (row) => NOTIFICATION_TYPE_LABELS[row.type] ?? row.type },
              { key: 'created', header: 'Created', cell: (row) => formatDate(row.created_at) },
              { key: 'state', header: 'State', cell: (row) => (row.is_read ? 'Read' : 'Unread') },
            ]}
          />
        )}
      </div>
    </>
  );
}
