import { getTranslations } from 'next-intl/server';
import { Card, CardContent } from '@/components/ui/card';
import { getAdminCommissions, getAdminCommissionStats, type AdminQueryParams } from '@/actions/admin/queries';
import { CommissionsTableClient } from './commissions-table-client';

export default async function AdminCommissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const t = await getTranslations('admin');
  const params = await searchParams;

  const queryParams: AdminQueryParams = {
    page: Number(params.page) || 1,
    sort: params.sort,
    filters: {
      ...(params.status ? { status: params.status } : {}),
    },
  };

  const [result, stats] = await Promise.all([
    getAdminCommissions(queryParams),
    getAdminCommissionStats(),
  ]);

  const translations: Record<string, string> = {
    col_commissionId: t('table.columns.commissionId'),
    col_status: t('table.columns.status'),
    col_amount: t('table.columns.amount'),
    col_vat: t('table.columns.vat'),
    col_total: t('table.columns.total'),
    col_dueDate: t('table.columns.dueDate'),
    col_created: t('table.columns.created'),
    col_actions: t('table.columns.actions'),
    sort_newest: t('table.sort.newest'),
    sort_oldest: t('table.sort.oldest'),
    sort_amountHigh: t('table.sort.amountHigh'),
    sort_amountLow: t('table.sort.amountLow'),
    sort_dueSoon: t('table.sort.dueSoon'),
    commStatus_pending: t('commissionStatus.pending'),
    commStatus_approved: t('commissionStatus.approved'),
    commStatus_paid: t('commissionStatus.paid'),
    commStatus_disputed: t('commissionStatus.disputed'),
    commStatus_overdue: t('commissionStatus.overdue'),
    noCommissions: t('commissionsPage.noCommissions'),
    action_approve: t('commissionsPage.amount'),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('commissionsPage.title')}</h1>
        <p className="text-muted-foreground">{t('commissionsPage.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('commissionsPage.pendingPayment')}</p>
            <p className="text-2xl font-bold text-status-pending">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('commissionsPage.disputes')}</p>
            <p className="text-2xl font-bold text-destructive">{stats.disputed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('commissionsPage.overdue')}</p>
            <p className="text-2xl font-bold text-warning">{stats.overdue}</p>
          </CardContent>
        </Card>
      </div>

      <CommissionsTableClient
        data={result.data}
        totalCount={result.totalCount}
        currentPage={result.page}
        totalPages={result.totalPages}
        translations={translations}
      />
    </div>
  );
}
