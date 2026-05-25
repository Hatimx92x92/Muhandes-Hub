import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Star, ThumbsUp, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/features/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { DirectionTabs } from '@/components/features/direction-tabs';
import { EmptyState } from '@/components/features/empty-state';
import { ReviewCard } from '@/components/features/reviews/review-card';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function ReviewsPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await routeParams;
  setRequestLocale(locale);
  const { tab = 'received' } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.reviews');

  // Fetch reviews given and received
  const [
    { data: receivedReviews },
    { data: givenReviews },
    { data: profile },
  ] = await Promise.all([
    db(supabase)
      .from('reviews')
      .select('*, reviewer:reviewer_id(company_name_ar, company_name_en), deal:deal_id(title_slug)')
      .eq('reviewee_id', user.id)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false }),
    db(supabase)
      .from('reviews')
      .select('*, reviewee:reviewee_id(company_name_ar, company_name_en), deal:deal_id(title_slug)')
      .eq('reviewer_id', user.id)
      .eq('is_hidden', false)
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
      <PageHeader title={t('title')} description={t('subtitle')} />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Star className="h-5 w-5 text-warning" />}
          label={t('overallRating')}
          value={avgRating > 0 ? avgRating.toFixed(1) : '—'}
          color="yellow"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-info" />}
          label={t('totalReviewsCount')}
          value={totalReviews}
        />
        <StatCard
          icon={<ThumbsUp className="h-5 w-5 text-success" />}
          label={t('recommendRate')}
          value={received.length > 0 ? `${recommendRate}%` : '—'}
          color="green"
        />
      </div>

      {/* Tabs */}
      <DirectionTabs
        tabs={[
          { key: 'received', label: t('receivedTab', { count: received.length }), count: received.length, href: '/dashboard/reviews?tab=received' },
          { key: 'given', label: t('givenTab', { count: given.length }), count: given.length, href: '/dashboard/reviews?tab=given' },
        ]}
        activeTab={activeTab}
      />

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
