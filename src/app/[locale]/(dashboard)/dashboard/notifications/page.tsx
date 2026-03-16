// =============================================================================
// Muqawil HUB — Notifications Page
// =============================================================================

import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/features/empty-state';
import { Bell, Settings } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { MarkAllReadButton } from '@/components/features/notifications/mark-all-read-button';
import { NotificationItem } from '@/components/features/notifications/notification-item';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.notifications');
  const locale = await getLocale();

  // Fetch notifications with pagination
  const { data: notifications } = await db(supabase)
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const items = notifications ?? [];
  const unreadCount = items.filter((n: { is_read: boolean }) => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? t('unreadCount', { count: unreadCount })
              : t('allRead')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && <MarkAllReadButton />}
          <Link href="/dashboard/notifications/preferences">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 me-1.5" />
              {t('preferencesButton')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Notification List */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-12 w-12" />}
          title={t('noNotifications')}
          description={t('noNotificationsDesc')}
        />
      ) : (
        <div className="space-y-2">
          {items.map((notification: {
            id: string;
            type: string;
            title_ar: string;
            title_en: string;
            body_ar: string | null;
            body_en: string | null;
            link: string | null;
            is_read: boolean;
            entity_type: string | null;
            entity_id: string | null;
            created_at: string;
          }) => (
            <NotificationItem
              key={notification.id}
              id={notification.id}
              type={notification.type}
              typeLabel={t(`types.${notification.type}` as never) || notification.type}
              titleAr={notification.title_ar}
              bodyAr={notification.body_ar}
              link={notification.link}
              isRead={notification.is_read}
              createdAt={notification.created_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}
