'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import { TrendingUp, Users, DollarSign, Layers, Filter } from 'lucide-react';
import {
  AnalyticsAreaChart,
  AnalyticsBarChart,
  AnalyticsDonutChart,
  AnalyticsRadarChart,
  AnalyticsRadialChart,
} from '../analytics/charts';

// ---------------------------------------------------------------------------
// Palette — consistent with chart CSS variables
// ---------------------------------------------------------------------------

const COLORS = [
  'var(--chart-1)', 'var(--chart-3)', 'var(--chart-2)', 'var(--chart-5)',
  'var(--chart-4)', 'var(--info)', 'var(--secondary-dark)', 'var(--success)',
];

// ---------------------------------------------------------------------------
// Chart configs
// ---------------------------------------------------------------------------

const signupChartConfig = {
  value: { label: 'Signups', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const revenueChartConfig = {
  value: { label: 'Revenue', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const roleRadarConfig = {
  value: { label: 'Users', color: 'var(--chart-2)' },
} satisfies ChartConfig;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AnalyticsChartsProps {
  usersByRole: Record<string, number>;
  usersByStatus: Record<string, number>;
  subscriptionsByTier: Record<string, number>;
  recentSignups: { date: string; count: number }[];
  revenueByMonth: { month: string; amount: number }[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnalyticsCharts({
  usersByRole,
  usersByStatus,
  subscriptionsByTier,
  recentSignups,
  revenueByMonth,
}: AnalyticsChartsProps) {
  const t = useTranslations('admin.analyticsPage');
  const locale = useLocale();
  const noData = t('noData');

  // Transform data
  const signupData = recentSignups.map((s) => ({ label: s.date, value: s.count }));
  const revenueData = revenueByMonth.map((r) => ({ label: r.month, value: r.amount }));

  const roleData = Object.entries(usersByRole).map(([name, value]) => ({
    label: name,
    value,
  }));

  const tierData = Object.entries(subscriptionsByTier).map(([name, value], i) => ({
    label: name,
    value,
    color: COLORS[i % COLORS.length],
  }));
  const tierChartConfig = Object.fromEntries(
    tierData.map((d) => [d.label, { label: d.label, color: d.color }])
  ) satisfies ChartConfig;

  // Registration funnel — compute total for percentage-based radial bars
  const statusEntries = Object.entries(usersByStatus);
  const statusTotal = statusEntries.reduce((sum, [, v]) => sum + v, 0);

  const formatSAR = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v));

  return (
    <div className="space-y-6">
      {/* Row 1: User Growth (Area) + Users by Role (Radar) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              {t('userGrowth')}
            </CardTitle>
            <CardDescription>{t('userGrowthDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsAreaChart
              data={signupData}
              config={signupChartConfig}
              locale={locale}
              emptyMessage={noData}
              gradientId="adminSignupsGrad"
            />
          </CardContent>
          {signupData.length > 0 && (
            <CardFooter className="gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              {t('signups')}
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-muted-foreground" />
              {t('usersByRole')}
            </CardTitle>
            <CardDescription>{t('usersByRoleDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <AnalyticsRadarChart
              data={roleData}
              config={roleRadarConfig}
              emptyMessage={noData}
            />
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Revenue (Bar) + Subscriptions by Tier (Donut) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              {t('revenueOverview')}
            </CardTitle>
            <CardDescription>{t('revenueOverviewDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsBarChart
              data={revenueData}
              config={revenueChartConfig}
              locale={locale}
              emptyMessage={noData}
              tickFormatter={formatSAR}
            />
          </CardContent>
          {revenueData.length > 0 && (
            <CardFooter className="gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              {t('totalRevenue')}
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-muted-foreground" />
              {t('revenueByTier')}
            </CardTitle>
            <CardDescription>{t('revenueByTierDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <AnalyticsDonutChart
              data={tierData}
              config={tierChartConfig}
              emptyMessage={noData}
              totalLabel={t('totalUsers')}
            />
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Registration Funnel — Radial gauges in a grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {t('registrationFunnel')}
          </CardTitle>
          <CardDescription>{t('registrationFunnelDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {statusTotal > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statusEntries.map(([status, count], i) => {
                const pct = Math.round((count / statusTotal) * 100);
                return (
                  <div key={status} className="flex flex-col items-center gap-1">
                    <AnalyticsRadialChart
                      value={pct}
                      label={status}
                      color={COLORS[i % COLORS.length]}
                    />
                    <span className="text-xs text-muted-foreground">
                      {count.toLocaleString(locale)} {t('users')}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-62.5 items-center justify-center text-sm text-muted-foreground">
              {noData}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
