'use client';

import { useContext, useMemo } from 'react';
import { Bell, CheckCheck, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks';
import { useNotifications } from '@/hooks/use-notifications';
import { RealtimeCountsContext } from '@/components/features/realtime-provider';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { NotificationItem } from './notification-item';
import type { NotificationRecord } from '@/actions/notifications';

// ---------------------------------------------------------------------------
// Time grouping
// ---------------------------------------------------------------------------
interface NotificationGroup {
  label: string;
  items: NotificationRecord[];
}

function groupByDate(
  notifications: NotificationRecord[],
  labels: { today: string; yesterday: string; thisWeek: string; older: string },
): NotificationGroup[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86_400_000;
  const weekStart = todayStart - 6 * 86_400_000;

  const buckets: Record<string, NotificationRecord[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  for (const n of notifications) {
    const t = n.created_at ? new Date(n.created_at).getTime() : 0;
    if (t >= todayStart) buckets.today.push(n);
    else if (t >= yesterdayStart) buckets.yesterday.push(n);
    else if (t >= weekStart) buckets.thisWeek.push(n);
    else buckets.older.push(n);
  }

  return [
    { label: labels.today, items: buckets.today },
    { label: labels.yesterday, items: buckets.yesterday },
    { label: labels.thisWeek, items: buckets.thisWeek },
    { label: labels.older, items: buckets.older },
  ].filter((g) => g.items.length > 0);
}

// ---------------------------------------------------------------------------
// Skeleton loading state
// ---------------------------------------------------------------------------
function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Skeleton className="mt-0.5 h-9 w-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface NotificationDropdownProps {
  userId: string;
  initialCount: number;
  ariaLabel: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function NotificationDropdown({
  userId,
  initialCount,
  ariaLabel,
}: NotificationDropdownProps) {
  const t = useTranslations('dashboard.notifications');
  const { locale } = useLocale();
  const ctx = useContext(RealtimeCountsContext);
  const count = ctx ? ctx.notificationCount : initialCount;

  const { notifications, unreadCount, markRead, markAllRead, isLoading } = useNotifications({
    userId,
  });

  const groupLabels = useMemo(
    () => ({
      today: t('groups.today'),
      yesterday: t('groups.yesterday'),
      thisWeek: t('groups.thisWeek'),
      older: t('groups.older'),
    }),
    [t],
  );

  const groups = useMemo(
    () => groupByDate(notifications, groupLabels),
    [notifications, groupLabels],
  );

  return (
    <Popover>
      {/* Trigger — bell icon with badge */}
      <PopoverTrigger
        className={cn(
          'relative inline-flex items-center justify-center rounded-lg p-2',
          'text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
        )}
        aria-label={ariaLabel}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -inset-e-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </PopoverTrigger>

      {/* Panel */}
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="flex w-95 flex-col overflow-hidden p-0"
        style={{ maxHeight: '520px' }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">{t('title')}</h2>
            {unreadCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="h-7 gap-1.5 text-xs"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t('markAllRead')}
            </Button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div>
              {Array.from({ length: 4 }).map((_, i) => (
                <NotificationSkeleton key={i} />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">{t('dropdown.empty')}</p>
              <p className="text-xs text-muted-foreground">{t('dropdown.emptyDesc')}</p>
            </div>
          ) : (
            <div>
              {groups.map((group) => (
                <div key={group.label}>
                  <div className="sticky top-0 bg-muted/80 px-4 py-1.5 backdrop-blur-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </span>
                  </div>
                  {group.items.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      locale={locale}
                      onMarkRead={markRead}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-4 py-2.5">
          <Link
            href="/dashboard/notifications"
            className="flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {t('dropdown.viewAll')}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
