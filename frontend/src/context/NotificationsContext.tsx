import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';
import type { AppNotification } from '../types';

// The server is the single source of truth — nothing seeded locally or kept
// in localStorage. Actions update the UI immediately, then roll back by
// re-fetching if the server request fails.
interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  /** True only for the very first load (nothing to show yet). */
  loading: boolean;
  refreshing: boolean;
  /** Set when the last refresh failed; the list shown is the last known server state. */
  error: string | null;
  lastRefreshedAt: Date | null;
  refresh: () => Promise<boolean>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const POLL_MS = 60_000;

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async (): Promise<boolean> => {
    if (!token || inFlight.current) return false;
    inFlight.current = true;
    setRefreshing(true);
    try {
      const res = await api.getNotifications({ token });
      if (res.ok && res.data) {
        setNotifications(res.data.notifications);
        setError(null);
        setLastRefreshedAt(new Date());
        return true;
      }
      setError(res.error ?? 'Failed to load notifications');
      return false;
    } finally {
      inFlight.current = false;
      setRefreshing(false);
      setLoading(false);
    }
  }, [token]);

  // Load on sign-in, forget everything on sign-out (no leaking one user's inbox to the next).
  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setError(null);
      setLastRefreshedAt(null);
      return;
    }
    setLoading(true);
    void refresh();
  }, [token, refresh]);

  // Keep it fresh: poll while the tab is visible, and catch up when it regains focus.
  useEffect(() => {
    if (!token) return;
    const tick = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const id = window.setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [token, refresh]);

  /** Apply `optimistic` now, send `request`, and re-sync from the server if it fails. */
  const act = useCallback(
    async (optimistic: (list: AppNotification[]) => AppNotification[], request: () => Promise<{ ok: boolean }>) => {
      setNotifications(optimistic);
      const res = await request();
      if (!res.ok) await refresh();
    },
    [refresh],
  );

  const markRead = useCallback(
    (id: string) =>
      act(
        (l) => l.map((n) => (n.id === id ? { ...n, isUnread: false } : n)),
        () => api.markNotificationRead(id, { token }),
      ),
    [act, token],
  );

  const markAllRead = useCallback(
    () =>
      act(
        (l) => l.map((n) => ({ ...n, isUnread: false })),
        () => api.markAllNotificationsRead({ token }),
      ),
    [act, token],
  );

  const remove = useCallback(
    (id: string) =>
      act(
        (l) => l.filter((n) => n.id !== id),
        () => api.deleteNotification(id, { token }),
      ),
    [act, token],
  );

  const clearAll = useCallback(
    () =>
      act(
        () => [],
        () => api.clearNotifications({ token }),
      ),
    [act, token],
  );

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshing,
        error,
        lastRefreshedAt,
        refresh,
        markRead,
        markAllRead,
        remove,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
}

/** "Just now" / "5 minutes ago" / "2 days ago" (or Lao), derived from a server timestamp. */
export function timeAgo(iso: string, lang: 'en' | 'lo', now: number = Date.now()): string {
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  const units: [number, string, string][] = [
    [86400, 'day', 'ມື້'],
    [3600, 'hour', 'ຊົ່ວໂມງ'],
    [60, 'minute', 'ນາທີ'],
  ];
  for (const [secs, en, lo] of units) {
    if (s >= secs) {
      const n = Math.floor(s / secs);
      return lang === 'lo' ? `${n} ${lo}ກ່ອນ` : `${n} ${en}${n === 1 ? '' : 's'} ago`;
    }
  }
  return lang === 'lo' ? 'ດຽວນີ້' : 'Just now';
}
