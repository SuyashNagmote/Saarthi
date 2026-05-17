import { create } from 'zustand';
import { apiFetch, API_URL, getAccessToken } from '../api/client';

/**
 * Notification store — Zustand per §2 + §9
 * - Poll every 60s via setInterval
 * - On tab focus (visibilitychange) immediate re-fetch
 * - On any successful mutation invalidate notifications cache
 */

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  startPolling: () => () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetch: async () => {
    set({ isLoading: true });
    try {
      const data = await apiFetch<{ notifications: Notification[]; unreadCount: number }>(
        '/notifications'
      );
      set({
        notifications: data.notifications,
        unreadCount: data.unreadCount,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  markRead: async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
      set((s) => ({
        unreadCount: Math.max(0, s.unreadCount - 1),
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
      }));
    } catch {
      // ignore
    }
  },

  markAllRead: async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PATCH' });
      set((s) => ({
        unreadCount: 0,
        notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
      }));
    } catch {
      // ignore
    }
  },

  /**
   * Start SSE connection for real-time notifications per P2
   */
  startPolling: () => {
    const token = getAccessToken();
    if (!token) return () => {};

    const url = `${API_URL}/notifications/stream?token=${token}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.notifications) {
          set({
            notifications: data.notifications,
            unreadCount: data.unreadCount ?? data.notifications.filter((n: Notification) => !n.is_read).length,
            isLoading: false,
          });
        }
      } catch {
        // ignore parse error
      }
    };

    eventSource.onerror = () => {
      // EventSource automatically reconnects on error, no manual retry needed
    };

    return () => {
      eventSource.close();
    };
  },
}));
