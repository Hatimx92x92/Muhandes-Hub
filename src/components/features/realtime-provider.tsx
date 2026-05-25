// =============================================================================
// Muhandes HUB — Realtime Provider
// Manages live unread counts (notifications + messages) and notification toasts.
// Wrap dashboard layout with this provider.
// =============================================================================

'use client';

import { createContext, useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';
import { useLocale } from '@/hooks';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
export interface RealtimeCountsContextValue {
  notificationCount: number;
  messageCount: number;
  setNotificationCount: (n: number | ((prev: number) => number)) => void;
}

export const RealtimeCountsContext =
  createContext<RealtimeCountsContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
interface RealtimeProviderProps {
  userId: string;
  initialNotificationCount: number;
  initialMessageCount: number;
  children: React.ReactNode;
}

export function RealtimeProvider({
  userId,
  initialNotificationCount,
  initialMessageCount,
  children,
}: RealtimeProviderProps) {
  const [notificationCount, setNotificationCount] = useState(initialNotificationCount);
  const [messageCount, setMessageCount] = useState(initialMessageCount);
  const { locale } = useLocale();
  const router = useRouter();
  const supabaseRef = useRef(createClient());

  // Re-sync server counts when they change (e.g. after navigation)
  useEffect(() => {
    setNotificationCount(initialNotificationCount);
  }, [initialNotificationCount]);

  useEffect(() => {
    setMessageCount(initialMessageCount);
  }, [initialMessageCount]);

  // Refresh message count from server (no good way to compute client-side)
  const refreshMessageCount = useCallback(async () => {
    const supabase = supabaseRef.current;
    const { count } = await supabase
      .from('conversation_participants')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gt('unread_count', 0);
    if (count !== null) setMessageCount(count);
  }, [userId]);

  useEffect(() => {
    const supabase = supabaseRef.current;

    // Channel 1: Notifications — INSERT (new) + UPDATE (mark read)
    const notifChannel = supabase
      .channel(`rt-notif:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Increment count
          setNotificationCount((prev) => prev + 1);

          // Show toast
          const record = payload.new as {
            title_ar?: string;
            title_en?: string;
          };
          const title =
            locale === 'ar'
              ? record.title_ar || record.title_en || ''
              : record.title_en || record.title_ar || '';
          if (title) toast.info(title, { duration: 6000 });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const oldRec = payload.old as { is_read?: boolean };
          const newRec = payload.new as { is_read?: boolean };
          // Decrement when notification is marked read
          if (!oldRec.is_read && newRec.is_read) {
            setNotificationCount((prev) => Math.max(0, prev - 1));
          }
        },
      )
      .subscribe();

    // Channel 2: Messages — new messages or participant unread_count changes
    const msgChannel = supabase
      .channel(`rt-msg:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Re-fetch message count from server
          refreshMessageCount();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // New message anywhere — refresh count (RLS ensures we only get our conversations)
          refreshMessageCount();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [userId, locale, refreshMessageCount, router]);

  return (
    <RealtimeCountsContext.Provider value={{ notificationCount, messageCount, setNotificationCount }}>
      {children}
    </RealtimeCountsContext.Provider>
  );
}
