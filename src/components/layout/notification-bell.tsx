'use client';

import { NotificationDropdown } from '@/components/features/notifications/notification-dropdown';

interface NotificationBellProps {
  userId: string;
  initialCount: number;
  ariaLabel: string;
}

export function NotificationBell({ userId, initialCount, ariaLabel }: NotificationBellProps) {
  return (
    <NotificationDropdown
      userId={userId}
      initialCount={initialCount}
      ariaLabel={ariaLabel}
    />
  );
}
