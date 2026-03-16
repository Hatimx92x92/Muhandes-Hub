// =============================================================================
// Muqawil HUB — Notification Preferences Page
// =============================================================================

import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { NotificationPreferenceToggle } from '@/components/features/notifications/notification-preference-toggle';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

/** Notification type groups — labels resolved via next-intl */
const NOTIFICATION_GROUPS = [
  {
    groupKey: 'bids',
    types: [
      { type: 'bid_received', critical: false },
      { type: 'bid_awarded', critical: true },
      { type: 'bid_shortlisted', critical: false },
      { type: 'bid_rejected', critical: false },
    ],
  },
  {
    groupKey: 'quotations',
    types: [
      { type: 'inquiry_received', critical: false },
      { type: 'quotation_received', critical: false },
      { type: 'quotation_accepted', critical: false },
    ],
  },
  {
    groupKey: 'deals',
    types: [
      { type: 'deal_created', critical: true },
      { type: 'deal_status_changed', critical: false },
      { type: 'deal_completed', critical: true },
    ],
  },
  {
    groupKey: 'finance',
    types: [
      { type: 'payment_confirmed', critical: true },
      { type: 'commission_due', critical: true },
      { type: 'commission_overdue', critical: true },
    ],
  },
  {
    groupKey: 'reviewsPosts',
    types: [
      { type: 'review_received', critical: false },
      { type: 'post_approved', critical: false },
      { type: 'post_rejected', critical: false },
    ],
  },
  {
    groupKey: 'rfqs',
    types: [
      { type: 'rfq_published', critical: false },
      { type: 'rfq_response_received', critical: false },
      { type: 'rfq_response_accepted', critical: false },
      { type: 'rfq_response_rejected', critical: false },
    ],
  },
  {
    groupKey: 'subscriptionDocs',
    types: [
      { type: 'subscription_expiring', critical: false },
      { type: 'subscription_expired', critical: false },
      { type: 'document_approved', critical: false },
      { type: 'document_rejected', critical: false },
    ],
  },
];

export default async function NotificationPreferencesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.notifications');

  // Fetch current preferences
  const { data: preferences } = await db(supabase)
    .from('notification_preferences')
    .select('notification_type, email_enabled')
    .eq('user_id', user.id);

  const prefsMap = new Map<string, boolean>();
  (preferences ?? []).forEach((p: { notification_type: string; email_enabled: boolean }) => {
    prefsMap.set(p.notification_type, p.email_enabled);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/notifications"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="h-5 w-5 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('prefPage.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('prefPage.subtitle')}
          </p>
        </div>
      </div>

      {/* Preference Groups */}
      <div className="space-y-4">
        {NOTIFICATION_GROUPS.map((group) => (
          <Card key={group.groupKey}>
            <CardHeader>
              <CardTitle className="text-base">{t(`prefPage.groups.${group.groupKey}`)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.types.map((item) => (
                <NotificationPreferenceToggle
                  key={item.type}
                  notificationType={item.type}
                  label={t(`types.${item.type}`)}
                  emailEnabled={prefsMap.get(item.type) ?? true}
                  isCritical={item.critical}
                />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {t('prefPage.criticalNote')}
      </p>
    </div>
  );
}
