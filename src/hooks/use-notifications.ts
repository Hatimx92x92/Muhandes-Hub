'use client';

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  getRecentNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/actions/notifications';
import type { NotificationRecord } from '@/actions/notifications';
import { RealtimeCountsContext } from '@/components/features/realtime-provider';

interface UseNotificationsOptions {
  userId: string;
}

interface UseNotificationsReturn {
  notifications: NotificationRecord[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  isLoading: boolean;
}

export function useNotifications({ userId }: UseNotificationsOptions): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const ctx = useContext(RealtimeCountsContext);
  const supabaseRef = useRef(createClient());

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  );

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    getRecentNotifications().then((result) => {
      if (!cancelled && result.data) {
        setNotifications(result.data);
      }
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Realtime subscription — re-fetch on INSERT to avoid partial payload issues
  // (Realtime may not include all columns if the publication excludes them)
  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`notif-dropdown:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          getRecentNotifications().then((result) => {
            if (result.data) setNotifications(result.data);
          });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    await markNotificationRead(id);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    ctx?.setNotificationCount(0);
    await markAllNotificationsRead();
  }, [ctx]);

  return { notifications, unreadCount, markRead, markAllRead, isLoading };
}
