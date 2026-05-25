// =============================================================================
// Muhandes HUB — Notifications Page
// =============================================================================

import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Settings } from 'lucide-react';
import { MarkAllReadButton } from '@/components/features/notifications/mark-all-read-button';
import {
  NotificationsTableClient,
  type NotificationRow,
} from '@/components/features/notifications/notifications-table-client';
import {
  bulkMarkNotificationsRead,
  bulkDeleteNotifications,
} from '@/actions/notifications';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function NotificationsPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ is_read?: string; type?: string; page?: string; search?: string; sort?: string }>;
}) {
  const { locale } = await routeParams;
  setRequestLocale(locale);
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.notifications');
  const tCommon = await getTranslations('dashboard.common');

  const page = Math.max(1, Number(params.page) || 1);
  const perPage = 20;
  const search = params.search?.trim() || '';
  const sort = params.sort || '';

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: 'created_at', ascending: false },
    oldest: { column: 'created_at', ascending: true },
  };
  const sortConfig = sortMap[sort] ?? sortMap.newest;

  // Paginated query
  let query = db(supabase)
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order(sortConfig.column, { ascending: sortConfig.ascending });

  if (params.is_read === 'true') query = query.eq('is_read', true);
  if (params.is_read === 'false') query = query.eq('is_read', false);

  if (params.type) query = query.eq('type', params.type);

  if (search) {
    const term = `%${search}%`;
    query = query.or(`title_ar.ilike.${term},title_en.ilike.${term}`);
  }

  const { data: notifications, count } = await query.range((page - 1) * perPage, page * perPage - 1);

  const rawItems = notifications ?? [];
  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / perPage);

  // Unread count (separate lightweight query)
  const { count: unreadCount } = await db(supabase)
    .from('notifications')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('is_read', false);

  const items: NotificationRow[] = rawItems.map((n: {
    id: string;
    type: string;
    title_ar: string;
    title_en: string;
    body_ar: string | null;
    body_en: string | null;
    link: string | null;
    is_read: boolean;
    created_at: string;
  }) => ({
    id: n.id,
    type: n.type,
    typeLabel: t(`types.${n.type}` as never) || n.type,
    title: locale === 'ar' ? n.title_ar : (n.title_en || n.title_ar),
    body: locale === 'ar' ? n.body_ar : (n.body_en || n.body_ar),
    link: n.link,
    is_read: n.is_read,
    created_at: n.created_at,
  }));

  // Build type filter options from known notification types
  const notificationTypes = [
    'bid_received', 'bid_awarded', 'bid_shortlisted', 'bid_rejected',
    'inquiry_received', 'quotation_received', 'quotation_accepted',
    'deal_created', 'deal_status_changed', 'deal_completed',
    'payment_confirmed', 'commission_due', 'commission_overdue',
    'review_received', 'subscription_expiring', 'subscription_expired',
    'document_approved', 'document_rejected', 'post_approved', 'post_rejected',
    'rfq_published', 'rfq_response_received', 'rfq_response_accepted', 'rfq_response_rejected',
  ] as const;

  const filterGroups = [
    {
      key: 'is_read',
      label: tCommon('status'),
      options: [
        { value: 'false', label: t('unread') },
        { value: 'true', label: t('read') },
      ],
    },
    {
      key: 'type',
      label: t('filterByType'),
      options: notificationTypes.map((type) => ({
        value: type,
        label: t(`types.${type}` as never) || type,
      })),
    },
  ];

  const sortOptions = [
    { value: 'newest', label: tCommon('createdAt') + ' ↓' },
    { value: 'oldest', label: tCommon('createdAt') + ' ↑' },
  ];

  const translations: Record<string, string> = {
    type: t('typeLabel'),
    message: t('messageLabel'),
    time: t('timeLabel'),
    markRead: t('markRead'),
    delete: tCommon('delete'),
    noNotifications: t('noNotifications'),
    noNotificationsDesc: t('noNotificationsDesc'),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={(unreadCount ?? 0) > 0 ? t('unreadCount', { count: unreadCount ?? 0 }) : t('allRead')}
        action={
          <div className="flex items-center gap-2">
            {(unreadCount ?? 0) > 0 && <MarkAllReadButton />}
            <Link href="/dashboard/notifications/preferences">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 me-1.5" />
                {t('preferencesButton')}
              </Button>
            </Link>
          </div>
        }
      />

      {/* Notifications Table */}
      <NotificationsTableClient
        items={items}
        totalCount={totalCount}
        currentPage={page}
        totalPages={totalPages}
        filterGroups={filterGroups}
        sortOptions={sortOptions}
        translations={translations}
        onBulkMarkRead={async (ids: string[]) => {
          'use server';
          await bulkMarkNotificationsRead(ids);
        }}
        onBulkDelete={async (ids: string[]) => {
          'use server';
          await bulkDeleteNotifications(ids);
        }}
      />
    </div>
  );
}
