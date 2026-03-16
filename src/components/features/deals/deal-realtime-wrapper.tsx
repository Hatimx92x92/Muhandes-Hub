// =============================================================================
// Deal Realtime Wrapper — Client component to enable realtime on deal pages
// =============================================================================

'use client';

import { useDealRealtime } from '@/hooks/use-realtime';

interface DealRealtimeWrapperProps {
  dealId: string;
  children: React.ReactNode;
}

export function DealRealtimeWrapper({ dealId, children }: DealRealtimeWrapperProps) {
  useDealRealtime(dealId);
  return <>{children}</>;
}
