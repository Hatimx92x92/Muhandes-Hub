'use client';

import { useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { cn, formatRelativeTime, getLocaleField } from '@/lib/utils';
import { getNotificationIcon } from './notification-icons';
import type { NotificationRecord } from '@/actions/notifications';

interface NotificationItemProps {
  notification: NotificationRecord;
  locale: string;
  onMarkRead: (id: string) => void;
}

export function NotificationItem({ notification, locale, onMarkRead }: NotificationItemProps) {
  const router = useRouter();
  const { icon: Icon, colorClass, bgClass } = getNotificationIcon(notification.type);

  const title = getLocaleField(
    notification as unknown as Record<string, unknown>,
    'title',
    locale,
  ) as string;
  const body = getLocaleField(
    notification as unknown as Record<string, unknown>,
    'body',
    locale,
  ) as string | null;

  const handleClick = useCallback(() => {
    if (!notification.is_read) {
      onMarkRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link as Parameters<typeof router.push>[0]);
    }
  }, [notification, onMarkRead, router]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'relative flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/50',
        !notification.is_read && 'bg-primary/5',
      )}
    >
      {/* Icon circle */}
      <div
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          bgClass,
        )}
      >
        <Icon className={cn('h-4 w-4', colorClass)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm leading-snug',
            notification.is_read ? 'text-muted-foreground' : 'font-medium text-foreground',
          )}
        >
          {title}
        </p>
        {body && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{body}</p>
        )}
        {notification.created_at && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            {formatRelativeTime(notification.created_at, locale)}
          </p>
        )}
      </div>

      {/* Unread indicator */}
      {!notification.is_read && (
        <span className="absolute inset-e-3 top-3.5 h-2 w-2 rounded-full bg-primary" />
      )}
    </button>
  );
}
