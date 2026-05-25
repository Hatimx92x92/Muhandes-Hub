import { getTranslations } from 'next-intl/server';
import { Card, CardContent } from '@/components/ui/card';
import { getAdminSubscriptions, getAdminSubscriptionStats, type AdminQueryParams } from '@/actions/admin/queries';
import { SubscriptionsTableClient } from './subscriptions-table-client';

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const t = await getTranslations('admin');
  const params = await searchParams;

  const queryParams: AdminQueryParams = {
    page: Number(params.page) || 1,
    search: params.search,
    sort: params.sort,
    filters: {
      ...(params.tier ? { tier: params.tier } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
  };

  const [result, stats] = await Promise.all([
    getAdminSubscriptions(queryParams),
    getAdminSubscriptionStats(),
  ]);

  const translations: Record<string, string> = {
    col_user: t('table.columns.user'),
    col_tier: t('table.columns.tier'),
    col_status: t('table.columns.status'),
    col_receipt: t('table.columns.receipt'),
    viewReceipt: t('table.columns.viewReceipt'),
    col_price: t('table.columns.price'),
    col_startDate: t('table.columns.startDate'),
    col_expiresDate: t('table.columns.expiresDate'),
    col_actions: t('table.columns.actions'),
    sort_newest: t('table.sort.newest'),
    sort_oldest: t('table.sort.oldest'),
    sort_dueSoon: t('table.sort.dueSoon'),
    sort_amountHigh: t('table.sort.amountHigh'),
    sort_amountLow: t('table.sort.amountLow'),
    tier_starter: t('subscriptionTier.starter'),
    tier_pro: t('subscriptionTier.pro'),
    tier_business: t('subscriptionTier.business'),
    tier_enterprise: t('subscriptionTier.enterprise'),
    subStatus_active: t('subscriptionStatus.active'),
    subStatus_expired: t('subscriptionStatus.expired'),
    subStatus_pending: t('subscriptionStatus.pending_payment'),
    noSubscriptions: t('subscriptionsPage.noSubscriptions'),
    searchPlaceholder: t('subscriptionsPage.title'),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('subscriptionsPage.title')}</h1>
        <p className="text-muted-foreground">{t('subscriptionsPage.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('subscriptionTier.starter')}</p>
            <p className="text-2xl font-bold">{stats.starter}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('subscriptionTier.pro')}</p>
            <p className="text-2xl font-bold text-[var(--tier-pro-foreground)]">{stats.pro}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('subscriptionTier.business')}</p>
            <p className="text-2xl font-bold text-[var(--tier-business-foreground)]">{stats.business}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('subscriptionTier.enterprise')}</p>
            <p className="text-2xl font-bold text-[var(--tier-enterprise-foreground)]">{stats.enterprise}</p>
          </CardContent>
        </Card>
      </div>

      <SubscriptionsTableClient
        data={result.data}
        totalCount={result.totalCount}
        currentPage={result.page}
        totalPages={result.totalPages}
        translations={translations}
      />
    </div>
  );
}
