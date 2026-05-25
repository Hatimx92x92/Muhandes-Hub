// =============================================================================
// Muhandes HUB — useRealtimeCounts Hook
// Consume live notification + message counts from RealtimeProvider context.
// =============================================================================

'use client';

import { useContext } from 'react';
import { RealtimeCountsContext } from '@/components/features/realtime-provider';
import type { RealtimeCountsContextValue } from '@/components/features/realtime-provider';

/**
 * Returns live unread notification and message counts.
 * Must be used inside <RealtimeProvider>.
 * Falls back to { notificationCount: 0, messageCount: 0 } outside the provider.
 */
export function useRealtimeCounts(): RealtimeCountsContextValue {
  const ctx = useContext(RealtimeCountsContext);
  return ctx ?? { notificationCount: 0, messageCount: 0, setNotificationCount: () => {} };
}
