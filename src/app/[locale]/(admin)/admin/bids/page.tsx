// =============================================================================
// Admin — Bids List Page
// =============================================================================

import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAdminBids, type AdminQueryParams } from '@/actions/admin/queries';
import { AdminBidsTableClient } from './bids-table-client';

export default async function AdminBidsPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await routeParams;
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const params = await searchParams;

  const queryParams: AdminQueryParams = {
    page: Number(params.page) || 1,
    sort: params.sort,
    filters: {
      ...(params.status ? { status: params.status } : {}),
      ...(params.project_id ? { project_id: params.project_id } : {}),
    },
  };

  const result = await getAdminBids(queryParams);

  const translations: Record<string, string> = {
    colContractor: t('table.columns.contractor'),
    colProject: t('table.columns.project'),
    colAmount: t('table.columns.amount'),
    colTimeline: t('table.columns.timeline'),
    colStatus: t('table.columns.status'),
    colCreated: t('table.columns.created'),
    sort_newest: t('table.sort.newest'),
    sort_oldest: t('table.sort.oldest'),
    sort_amountHigh: t('table.sort.amountHigh'),
    sort_amountLow: t('table.sort.amountLow'),
    status_pending: t('bidStatus.pending'),
    status_accepted: t('bidStatus.accepted'),
    status_rejected: t('bidStatus.rejected'),
    status_withdrawn: t('bidStatus.withdrawn'),
    days: t('days'),
    noBids: t('bidsPage.noBids'),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('bidsPage.title')}</h1>
        <p className="text-muted-foreground">{t('bidsPage.subtitle')}</p>
      </div>

      <AdminBidsTableClient
        data={result.data}
        totalCount={result.totalCount}
        currentPage={result.page}
        totalPages={result.totalPages}
        locale={locale}
        translations={translations}
      />
    </div>
  );
}
