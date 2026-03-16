import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { AdminReviewActions } from '@/components/features/admin/review-actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const t = await getTranslations('admin');
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const filter = params.filter ?? 'all';

  let query = db(supabase)
    .from('reviews')
    .select('id, deal_id, reviewer_id, reviewee_id, overall_rating, comment_ar, comment_en, is_hidden, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (filter === 'hidden') {
    query = query.eq('is_hidden', true);
  } else if (filter === 'visible') {
    query = query.eq('is_hidden', false);
  }

  const { data: reviews } = await query;

  const { count: totalCount } = await db(supabase)
    .from('reviews').select('*', { count: 'exact', head: true });
  const { count: hiddenCount } = await db(supabase)
    .from('reviews').select('*', { count: 'exact', head: true }).eq('is_hidden', true);

  const filters = ['all', 'visible', 'hidden'];

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
            <p className="text-2xl font-bold">{totalCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('reviewsPage.hiddenLabel')}</p>
            <p className="text-2xl font-bold text-red-600">{hiddenCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <a
            key={f}
            href={`/admin/reviews?filter=${f}`}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t(`reviewFilter.${f}`)}
          </a>
        ))}
      </div>

      {/* Reviews list */}
      {!reviews || reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Star className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">{t('reviewsPage.noReviews')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(reviews as Record<string, unknown>[]).map((review) => (
            <Card key={review.id as string} className={review.is_hidden ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Number(review.overall_rating ?? 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({String(review.overall_rating)}/5)
                      </span>
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    {!!review.is_hidden && <Badge variant="destructive">{t('reviewsPage.hiddenBadge')}</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {!!review.comment_ar && (
                  <p className="text-sm">{review.comment_ar as string}</p>
                )}
                {!!review.comment_en && (
                  <p className="text-sm text-muted-foreground" dir="ltr">{review.comment_en as string}</p>
                )}

                <div className="flex items-center justify-between">
                  <time className="text-xs text-muted-foreground">
                    {new Date(review.created_at as string).toLocaleDateString(locale)}
                  </time>
                  <AdminReviewActions
                    reviewId={review.id as string}
                    isHidden={!!review.is_hidden}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
