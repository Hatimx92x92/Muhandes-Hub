// =============================================================================
// Muhandes HUB — Notification Item Component
// =============================================================================

'use client';

import { useTransition } from 'react';
import { Link } from '@/i18n/navigation';
import { markNotificationRead } from '@/actions/notifications';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';

interface NotificationItemProps {
  id: string;
  type: string;
  typeLabel: string;
  titleAr: string;
  bodyAr: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationItem({
  id,
  type,
  typeLabel,
  titleAr,
  bodyAr,
  link,
  isRead,
  createdAt,
}: NotificationItemProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!isRead) {
      startTransition(async () => {
        await markNotificationRead(id);
      });
    }
  };

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border p-4 transition-colors',
        !isRead && 'bg-primary/5 border-primary/20',
        isRead && 'bg-card',
        isPending && 'opacity-60',
        link && 'cursor-pointer hover:bg-muted/50',
      )}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      <div className="pt-1.5 shrink-0">
        <div
          className={cn(
            'h-2 w-2 rounded-full',
            !isRead ? 'bg-primary' : 'bg-transparent',
          )}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className="text-[10px]">
            {typeLabel}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(createdAt)}
          </span>
        </div>
        <p className={cn('text-sm', !isRead ? 'font-semibold text-foreground' : 'text-foreground')}>
          {titleAr}
        </p>
        {bodyAr && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {bodyAr}
          </p>
        )}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href={link} onClick={handleClick}>
        {content}
      </Link>
    );
  }

  return content;
}
