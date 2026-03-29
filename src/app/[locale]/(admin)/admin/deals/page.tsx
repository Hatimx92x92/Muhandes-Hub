import { getTranslations } from 'next-intl/server';
import { getAdminDeals, type AdminQueryParams } from '@/actions/admin/queries';
import { DealsTableClient } from './deals-table-client';

export default async function AdminDealsPage({
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

  const result = await getAdminDeals(queryParams);

  const translations: Record<string, string> = {
    col_dealId: t('table.columns.dealId'),
    col_type: t('table.columns.type'),
    col_status: t('table.columns.status'),
    col_value: t('table.columns.value'),
    col_created: t('table.columns.created'),
    sort_newest: t('table.sort.newest'),
    sort_oldest: t('table.sort.oldest'),
    sort_valueHigh: t('table.sort.valueHigh'),
    sort_valueLow: t('table.sort.valueLow'),
    dealStatus_active: t('dealStatus.active'),
    dealStatus_in_progress: t('dealStatus.in_progress'),
    dealStatus_completed: t('dealStatus.completed'),
    dealStatus_cancelled: t('dealStatus.cancelled'),
    dealStatus_disputed: t('dealStatus.disputed'),
    'dealType_DEAL-PROJECT': t('dealType.DEAL-PROJECT'),
    'dealType_DEAL-PRODUCT': t('dealType.DEAL-PRODUCT'),
    noDeals: t('dealsPage.noDeals'),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('dealsPage.title')}</h1>
        <p className="text-muted-foreground">{t('dealsPage.subtitle')}</p>
      </div>

      <DealsTableClient
        data={result.data}
        totalCount={result.totalCount}
        currentPage={result.page}
        totalPages={result.totalPages}
        translations={translations}
      />
    </div>
  );
}
