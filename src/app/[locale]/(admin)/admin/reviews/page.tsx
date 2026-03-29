import { getTranslations } from 'next-intl/server';
import { Card, CardContent } from '@/components/ui/card';
import { getAdminReviews, getAdminReviewStats, type AdminQueryParams } from '@/actions/admin/queries';
import { ReviewsTableClient } from './reviews-table-client';

export default async function AdminReviewsPage({
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
      ...(params.visibility ? { visibility: params.visibility } : {}),
    },
  };

  const [result, stats] = await Promise.all([
    getAdminReviews(queryParams),
    getAdminReviewStats(),
  ]);

  const translations: Record<string, string> = {
    col_rating: t('table.columns.rating'),
    col_comment: t('table.columns.comment'),
    col_visibility: t('table.columns.visibility'),
    col_created: t('table.columns.created'),
    col_actions: t('table.columns.actions'),
    sort_newest: t('table.sort.newest'),
    sort_oldest: t('table.sort.oldest'),
    sort_ratingHigh: t('table.sort.ratingHigh'),
    sort_ratingLow: t('table.sort.ratingLow'),
    visibility_visible: t('reviewFilter.visible'),
    visibility_hidden: t('reviewFilter.hidden'),
    noReviews: t('reviewsPage.noReviews'),
    action_hide: t('reviewsPage.hiddenBadge'),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('reviewsPage.title')}</h1>
        <p className="text-muted-foreground">{t('reviewsPage.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('reviewsPage.totalReviews')}</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('reviewsPage.hiddenLabel')}</p>
            <p className="text-2xl font-bold text-destructive">{stats.hidden}</p>
          </CardContent>
        </Card>
      </div>

      <ReviewsTableClient
        data={result.data}
        totalCount={result.totalCount}
        currentPage={result.page}
        totalPages={result.totalPages}
        translations={translations}
      />
    </div>
  );
}
