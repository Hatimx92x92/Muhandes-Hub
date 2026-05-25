import { getTranslations } from 'next-intl/server';
import { Card, CardContent } from '@/components/ui/card';
import { getAdminPayments, getAdminPaymentStats, type AdminQueryParams } from '@/actions/admin/queries';
import { PaymentsTableClient } from './payments-table-client';

export default async function AdminPaymentsPage({
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
      ...(params.status ? { status: params.status } : {}),
      ...(params.method ? { method: params.method } : {}),
    },
  };

  const [result, stats] = await Promise.all([
    getAdminPayments(queryParams),
    getAdminPaymentStats(),
  ]);

  const translations: Record<string, string> = {
    col_user: t('table.columns.user'),
    col_tier: t('table.columns.tier'),
    col_status: t('table.columns.status'),
    col_receipt: t('table.columns.receipt'),
    viewReceipt: t('table.columns.viewReceipt'),
    col_price: t('table.columns.price'),
    col_paymentMethod: t('paymentsPage.paymentMethod'),
    col_date: t('paymentsPage.date'),
    col_actions: t('table.columns.actions'),
    sort_newest: t('table.sort.newest'),
    sort_oldest: t('table.sort.oldest'),
    sort_amountHigh: t('table.sort.amountHigh'),
    sort_amountLow: t('table.sort.amountLow'),
    tier_starter: t('subscriptionTier.starter'),
    tier_pro: t('subscriptionTier.pro'),
    tier_business: t('subscriptionTier.business'),
    tier_enterprise: t('subscriptionTier.enterprise'),
    status_pending: t('paymentsPage.statusPending'),
    status_completed: t('paymentsPage.statusCompleted'),
    status_failed: t('paymentsPage.statusFailed'),
    pm_card: t('paymentsPage.pmCard'),
    pm_bank_transfer: t('paymentsPage.pmBankTransfer'),
    pm_free: t('paymentsPage.pmFree'),
    noPayments: t('paymentsPage.noPayments'),
    searchPlaceholder: t('paymentsPage.searchPlaceholder'),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('paymentsPage.title')}</h1>
        <p className="text-muted-foreground">{t('paymentsPage.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('paymentsPage.statusPending')}</p>
            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('paymentsPage.statusCompleted')}</p>
            <p className="text-2xl font-bold text-success">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('paymentsPage.statusFailed')}</p>
            <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <PaymentsTableClient
        data={result.data}
        totalCount={result.totalCount}
        currentPage={result.page}
        totalPages={result.totalPages}
        translations={translations}
      />
    </div>
  );
}
