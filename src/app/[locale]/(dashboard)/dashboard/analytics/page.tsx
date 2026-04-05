import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { TIER_LIMITS } from '@/types';
import { getUserAnalytics } from '@/actions/analytics';
import { AnalyticsKpiCards, AnalyticsKpiSecondary } from '@/components/features/analytics/analytics-kpi-cards';
import { AnalyticsRoleStats } from '@/components/features/analytics/analytics-role-stats';
import { AnalyticsUserCharts } from '@/components/features/analytics/analytics-user-charts';
import { AnalyticsPeriodFilter } from '@/components/features/analytics/analytics-period-filter';
import { TierGate } from '@/components/features/tier-gate';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function AnalyticsDashboardPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.analytics');
  const tGate = await getTranslations('tierGate');
  const locale = await getLocale();

  // Get profile + subscription
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  const { data: subscription } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const tier = (subscription?.tier ?? 'starter') as string;
  const limits = TIER_LIMITS[tier] ?? TIER_LIMITS.starter;
  const role = profile?.role ?? 'project_owner';
  const isAdvanced = limits.hasAnalytics === 'full' || role === 'project_owner';

  // Resolve period from searchParams
  const resolvedParams = await searchParams;
  const period = resolvedParams.period ?? '30d';

  // Fetch analytics data via server action
  const result = await getUserAnalytics({ period });

  if (result.error || !result.data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">{result.error ?? 'Failed to load analytics'}</p>
      </div>
    );
  }

  const { kpi, trends, roleStats, charts } = result.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isAdvanced ? t('fullDashboard') : t('summaryWidget')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdvanced && <AnalyticsPeriodFilter currentPeriod={period} />}
          {isAdvanced && (
            <a
              href="/api/analytics/export"
              download
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <Download className="h-3.5 w-3.5" />
              {t('exportCsv')}
            </a>
          )}
          <Badge variant={tier === 'starter' ? 'outline' : tier as 'pro' | 'business' | 'enterprise'}>
            {t(`tiers.${tier}` as never)}
          </Badge>
        </div>
      </div>

      {/* KPI Cards — all tiers */}
      <AnalyticsKpiCards kpi={kpi} trends={trends} locale={locale} period={period} />

      {/* Secondary KPIs (rating, reviews, cancelled) */}
      <AnalyticsKpiSecondary kpi={kpi} locale={locale} />

      {/* Role-specific stats — all tiers */}
      <AnalyticsRoleStats roleStats={roleStats} locale={locale} />

      {/* Advanced: Charts — Business+ / Project Owner */}
      {isAdvanced && charts ? (
        <div>
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t('chartsSection')}
          </h3>
          <AnalyticsUserCharts charts={charts} role={role} locale={locale} />
        </div>
      ) : (
        <TierGate
          isLocked
          title={t('chartsLockedTitle')}
          description={t('chartsLockedDesc')}
          upgradeLabel={tGate('upgrade')}
          mode="inline"
        />
      )}
    </div>
  );
}
