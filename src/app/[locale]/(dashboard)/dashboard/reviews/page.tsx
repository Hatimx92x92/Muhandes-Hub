import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Star, ThumbsUp, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { ReviewCard } from '@/components/features/reviews/review-card';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = 'received' } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.reviews');
  const locale = await getLocale();

  // Fetch reviews given and received
  const [
    { data: receivedReviews },
    { data: givenReviews },
    { data: profile },
  ] = await Promise.all([
    db(supabase)
      .from('reviews')
      .select('*, reviewer:reviewer_id(company_name_ar, company_name_en), deal:deal_id(title_ar, title_en)')
      .eq('reviewee_id', user.id)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false }),
    db(supabase)
      .from('reviews')
      .select('*, reviewee:reviewee_id(company_name_ar, company_name_en), deal:deal_id(title_ar, title_en)')
      .eq('reviewer_id', user.id)
      .order('created_at', { ascending: false }),
    db(supabase)
      .from('profiles')
      .select('average_rating, total_reviews')
      .eq('id', user.id)
      .single(),
  ]);

  const received = (receivedReviews ?? []) as Record<string, unknown>[];
  const given = (givenReviews ?? []) as Record<string, unknown>[];
  const avgRating = (profile?.average_rating as number) ?? 0;
  const totalReviews = (profile?.total_reviews as number) ?? 0;

  // Calculate recommendation rate
  const recommendCount = received.filter((r) => r.would_recommend).length;
  const recommendRate = received.length > 0 ? Math.round((recommendCount / received.length) * 100) : 0;

  // Check which given reviews are within 48h edit window
  const now = Date.now();
  const editableIds = new Set(
    given
      .filter((r) => {
        const created = new Date(r.created_at as string).getTime();
        return now - created < 48 * 60 * 60 * 1000;
      })
      .map((r) => r.id as string),
  );

  const activeTab = tab === 'given' ? 'given' : 'received';
  const reviews = activeTab === 'received' ? received : given;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('overallRating')}</p>
              <p className="text-xl font-bold">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('totalReviewsCount')}</p>
              <p className="text-xl font-bold">{totalReviews}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <ThumbsUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('recommendRate')}</p>
              <p className="text-xl font-bold">{received.length > 0 ? `${recommendRate}%` : '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-1">
        <Link
          href="/dashboard/reviews?tab=received"
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'received'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('receivedTab', { count: received.length })}
        </Link>
        <Link
          href="/dashboard/reviews?tab=given"
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'given'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('givenTab', { count: given.length })}
        </Link>
      </div>

      {/* Review list */}
      {reviews.length === 0 ? (
        <EmptyState
          icon={<Star className="h-12 w-12" />}
          title={activeTab === 'received' ? t('noReceivedReviews') : t('noGivenReviews')}
          description={
            activeTab === 'received'
              ? t('noReceivedDesc')
              : t('noGivenDesc')
          }
          actionLabel={t('viewDeals')}
          actionHref="/dashboard/deals"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id as string}
              review={review as Record<string, unknown> & {
                id: string;
                overall_rating: number;
                quality_rating?: number | null;
                timeliness_rating?: number | null;
                communication_rating?: number | null;
                would_recommend: boolean;
                comment_ar?: string | null;
                comment_en?: string | null;
                created_at: string;
                reviewer?: { company_name_ar?: string; company_name_en?: string } | null;
                reviewee?: { company_name_ar?: string; company_name_en?: string } | null;
                deal?: { title_ar?: string; title_en?: string } | null;
              }}
              direction={activeTab === 'received' ? 'received' : 'given'}
              canEdit={activeTab === 'given' && editableIds.has(review.id as string)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
