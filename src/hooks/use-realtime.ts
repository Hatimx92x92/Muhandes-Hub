// =============================================================================
// Muqawil HUB — Supabase Realtime Hook
// =============================================================================

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface RealtimeOptions {
  /** Channel name (must be unique per subscription) */
  channel: string;
  /** Table to listen for changes */
  table: string;
  /** Event types to listen for */
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  /** Filter: e.g. 'deal_id=eq.some-uuid' */
  filter?: string;
  /** Callback when a change is received */
  onPayload?: (payload: RealtimePayload) => void;
  /** Auto-refresh the page on changes (default: true) */
  autoRefresh?: boolean;
}

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  table: string;
}

/**
 * Subscribe to Supabase Realtime changes for a specific table/filter.
 * Optionally auto-refreshes the page via router.refresh().
 */
export function useRealtime({
  channel: channelName,
  table,
  event = '*',
  filter,
  onPayload,
  autoRefresh = true,
}: RealtimeOptions) {
  const router = useRouter();
  const callbackRef = useRef(onPayload);
  callbackRef.current = onPayload;

  useEffect(() => {
    const supabase = createClient();

    const channelConfig: Record<string, unknown> = {
      event,
      schema: 'public',
      table,
    };

    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as unknown as 'system',
        channelConfig as unknown as { event: string },
        (payload: unknown) => {
          const realtimePayload = payload as RealtimePayload;

          if (callbackRef.current) {
            callbackRef.current(realtimePayload);
          }

          if (autoRefresh) {
            router.refresh();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, table, event, filter, autoRefresh, router]);
}

/**
 * Subscribe to deal workspace changes (deals, milestones, proofs, activity).
 */
export function useDealRealtime(dealId: string) {
  // Deal changes
  useRealtime({
    channel: `deal-${dealId}`,
    table: 'deals',
    filter: `id=eq.${dealId}`,
  });

  // Milestone changes
  useRealtime({
    channel: `deal-milestones-${dealId}`,
    table: 'deal_milestones',
    filter: `deal_id=eq.${dealId}`,
  });

  // Proof changes
  useRealtime({
    channel: `deal-proofs-${dealId}`,
    table: 'deal_proofs',
    filter: `deal_id=eq.${dealId}`,
  });

  // Activity log
  useRealtime({
    channel: `deal-activity-${dealId}`,
    table: 'deal_activity_log',
    filter: `deal_id=eq.${dealId}`,
    event: 'INSERT',
  });
}
