'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useLocale } from '@/hooks';

interface NotificationListenerProps {
  userId: string;
}

/**
 * Listens for new notifications via Supabase Realtime and shows toast.
 * Place this in the dashboard layout (renders nothing visible).
 */
export function NotificationListener({ userId }: NotificationListenerProps) {
  const { locale } = useLocale();
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const record = payload.new as {
            title_ar?: string;
            title_en?: string;
            type?: string;
          };

          const title = locale === 'ar'
            ? record.title_ar || record.title_en || ''
            : record.title_en || record.title_ar || '';

          if (title) {
            toast.info(title, { duration: 6000 });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, locale]);

  // Renders nothing — purely for side effects
  return null;
}
