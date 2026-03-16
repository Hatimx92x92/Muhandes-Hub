import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Handshake,
  Star,
  Eye,
  FileText,
  Lock,
} from 'lucide-react';
import { TIER_LIMITS } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function AnalyticsDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.analytics');
  const tCommon = await getTranslations('dashboard.common');
  const locale = await getLocale();

  // Get profile + subscription
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('id, role, full_name_ar')
    .eq('id', user.id)
    .single();

  const { data: subscription } = await db(supabase)
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  const tier = (subscription?.tier ?? 'starter') as keyof typeof TIER_LIMITS;
  const limits = TIER_LIMITS[tier];

  if (!limits.hasAnalytics) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Lock className="h-16 w-16 text-muted-foreground/50" />
        <h2 className="mt-4 text-xl font-bold">{t('locked')}</h2>
        <p className="mt-2 text-muted-foreground">
          {t('lockedDesc')}
        </p>
        <a href="/pricing" className="mt-4 text-primary hover:underline">
          {t('upgradeSubscription')}
        </a>
      </div>
    );
  }

  const isFullDashboard = tier === 'business' || tier === 'enterprise';

  // Fetch analytics data
  const role = profile?.role ?? 'project_owner';

  // Common stats for all roles
  const [
    { count: totalDeals },
    { count: completedDeals },
    { count: activeDeals },
    { data: avgRating },
  ] = await Promise.all([
    db(supabase).from('deals')
      .select('*', { count: 'exact', head: true })
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`),
    db(supabase).from('deals')
      .select('*', { count: 'exact', head: true })
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .eq('status', 'completed'),
    db(supabase).from('deals')
      .select('*', { count: 'exact', head: true })
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .in('status', ['active', 'in_progress']),
    db(supabase).from('reviews')
      .select('overall_rating')
      .eq('reviewee_id', user.id),
  ]);

  const ratings = (avgRating ?? []) as { overall_rating: number }[];
  const avgRatingValue = ratings.length > 0
    ? (ratings.reduce((s, r) => s + r.overall_rating, 0) / ratings.length).toFixed(1)
    : '—';

  // Role-specific stats
  let roleSpecificStats: { label: string; value: number | string; icon: typeof TrendingUp }[] = [];

  if (role === 'contractor' || role === 'project_owner') {
    const [{ count: myProjects }, { count: myBids }] = await Promise.all([
      db(supabase).from('projects').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      db(supabase).from('bids').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);
    roleSpecificStats = [
      { label: t('projects'), value: myProjects ?? 0, icon: FileText },
      { label: t('bidsLabel'), value: myBids ?? 0, icon: FileText },
    ];
  } else if (role === 'supplier') {
    const [{ count: myProducts }, { count: myQuotations }] = await Promise.all([
      db(supabase).from('products').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      db(supabase).from('quotations').select('*', { count: 'exact', head: true }).eq('sender_id', user.id),
    ]);
    roleSpecificStats = [
      { label: t('products'), value: myProducts ?? 0, icon: FileText },
      { label: t('quotations'), value: myQuotations ?? 0, icon: FileText },
    ];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {isFullDashboard ? t('fullDashboard') : t('summaryWidget')}
          </p>
        </div>
        <Badge variant={tier as 'pro' | 'business' | 'enterprise'}>
          {t(`tiers.${tier}` as never)}
        </Badge>
      </div>

      {/* Summary Stats — all tiers with analytics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Handshake className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('totalDeals')}</p>
              <p className="text-xl font-extrabold">{totalDeals ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-status-completed/10 text-status-completed">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('completedDeals')}</p>
              <p className="text-xl font-extrabold">{completedDeals ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-status-active/10 text-status-active">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('activeDeals')}</p>
              <p className="text-xl font-extrabold">{activeDeals ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-status-pending/10 text-status-pending">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('avgRating')}</p>
              <p className="text-xl font-extrabold">{avgRatingValue}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific stats */}
      {roleSpecificStats.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {roleSpecificStats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 pt-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/50 text-secondary-foreground">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-extrabold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Full Dashboard — Business+ only */}
      {isFullDashboard ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent deals activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Handshake className="h-4 w-4 text-muted-foreground" />
                {t('recentDeals')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecentDeals userId={user.id} />
            </CardContent>
          </Card>

          {/* Profile views placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4 text-muted-foreground" />
                {t('profileViews')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('profileViewsDesc')}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-8">
            <Lock className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t('fullDashboardLockDesc')}
            </p>
            <a href="/pricing" className="mt-2 text-sm text-primary hover:underline">
              {t('upgradeSubscription')}
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Sub-component for recent deals (server component)
async function RecentDeals({ userId }: { userId: string }) {
  const supabase = await createClient();
  const t = await getTranslations('dashboard.analytics');
  const tCommon = await getTranslations('dashboard.common');
  const locale = await getLocale();

  const { data: deals } = await db(supabase)
    .from('deals')
    .select('id, deal_type, status, total_value, created_at')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!deals || deals.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('noDealsYet')}</p>;
  }

  return (
    <div className="space-y-3">
      {(deals as Record<string, unknown>[]).map((deal) => (
        <div key={deal.id as string} className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">
              {t('dealNumber', { id: (deal.id as string).slice(0, 8) })}
            </p>
            <time className="text-xs text-muted-foreground">
              {new Date(deal.created_at as string).toLocaleDateString(locale)}
            </time>
          </div>
          <div className="text-end">
            <Badge variant={deal.status as 'active' | 'completed' | 'cancelled'}>
              {t(`dealStatus.${deal.status}` as never) ?? deal.status}
            </Badge>
            <p className="mt-1 text-xs font-medium">
              {Number(deal.total_value ?? 0).toLocaleString(locale)} {tCommon('sar')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
