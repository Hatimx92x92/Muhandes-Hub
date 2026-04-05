'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import type { AnalyticsCharts } from '@/actions/analytics';
import { Activity, DollarSign, PieChart as PieIcon, Star, Target, Package, Receipt, TrendingUp, Users, Radar, Filter } from 'lucide-react';
import {
  AnalyticsAreaChart,
  AnalyticsBarChart,
  AnalyticsDonutChart,
  AnalyticsLineChart,
  AnalyticsRadarChart,
  AnalyticsRadialChart,
} from './charts';

interface AnalyticsUserChartsProps {
  charts: AnalyticsCharts;
  role: string;
  locale: string;
}

// ---------------------------------------------------------------------------
// Chart configs — one per data series, with named color tokens
// ---------------------------------------------------------------------------

const dealsChartConfig = {
  value: { label: 'Deals', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const revenueChartConfig = {
  value: { label: 'Revenue', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const ratingChartConfig = {
  value: { label: 'Rating', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const bidsRadarConfig = {
  value: { label: 'Bids', color: 'var(--chart-4)' },
} satisfies ChartConfig;

const topProductsChartConfig = {
  value: { label: 'Views', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const quotationsRadarConfig = {
  value: { label: 'Quotations', color: 'var(--chart-5)' },
} satisfies ChartConfig;

const subRatingsConfig = {
  value: { label: 'Rating', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const topPartnersConfig = {
  value: { label: 'Revenue', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const funnelConfig = {
  value: { label: 'Count', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const projectsRadarConfig = {
  value: { label: 'Projects', color: 'var(--chart-4)' },
} satisfies ChartConfig;

const bidsReceivedRadarConfig = {
  value: { label: 'Bids', color: 'var(--chart-5)' },
} satisfies ChartConfig;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AnalyticsUserCharts({ charts, role, locale }: AnalyticsUserChartsProps) {
  const t = useTranslations('dashboard.analytics');

  const formatK = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v));

  return (
    <div className="space-y-6">
      {/* Row 1: Deals over time (Area) + Revenue trend (Bar) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-muted-foreground" />
              {t('charts.dealsOverTime')}
            </CardTitle>
            <CardDescription>{t('charts.dealsOverTimeDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsAreaChart
              data={charts.dealsOverTime}
              config={dealsChartConfig}
              locale={locale}
              emptyMessage={t('charts.noData')}
              gradientId="dealsGrad"
            />
          </CardContent>
          {charts.dealsOverTime.length > 0 && (
            <CardFooter className="gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              {t('charts.deals')}
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              {t('charts.revenueTrend')}
            </CardTitle>
            <CardDescription>{t('charts.revenueTrendDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsBarChart
              data={charts.revenueOverTime}
              config={revenueChartConfig}
              locale={locale}
              emptyMessage={t('charts.noData')}
              tickFormatter={formatK}
            />
          </CardContent>
          {charts.revenueOverTime.length > 0 && (
            <CardFooter className="gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              {t('charts.revenue')}
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Row 2: Deals by Status (Donut) + Role-specific chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieIcon className="h-4 w-4 text-muted-foreground" />
              {t('charts.dealsByStatus')}
            </CardTitle>
            <CardDescription>{t('charts.dealsByStatusDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <AnalyticsDonutChart
              data={charts.dealsByStatus.map((entry) => ({
                ...entry,
                label: t(`status.${entry.label}` as never),
              }))}
              config={Object.fromEntries(
                charts.dealsByStatus.map((entry) => [
                  t(`status.${entry.label}` as never),
                  { label: t(`status.${entry.label}` as never), color: entry.color },
                ])
              )}
              emptyMessage={t('charts.noData')}
              totalLabel={t('charts.total')}
            />
          </CardContent>
        </Card>

        <RoleSpecificChart charts={charts} role={role} locale={locale} />
      </div>

      {/* Row 3: Sub-Rating Radar + Top Partners Bar */}
      {(charts.subRatings.length > 0 || charts.topPartners.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {charts.subRatings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Radar className="h-4 w-4 text-muted-foreground" />
                  {t('charts.subRatings')}
                </CardTitle>
                <CardDescription>{t('charts.subRatingsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <AnalyticsRadarChart
                  data={charts.subRatings.map((entry) => ({
                    ...entry,
                    label: t(`charts.ratingCategory.${entry.label}` as never),
                  }))}
                  config={subRatingsConfig}
                  emptyMessage={t('charts.noData')}
                />
              </CardContent>
            </Card>
          )}
          {charts.topPartners.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {t('charts.topPartners')}
                </CardTitle>
                <CardDescription>{t('charts.topPartnersDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsBarChart
                  data={charts.topPartners}
                  config={topPartnersConfig}
                  locale={locale}
                  emptyMessage={t('charts.noData')}
                  layout="vertical"
                  tickFormatter={formatK}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Row 4: Conversion Funnel — full width */}
      {charts.conversionFunnel.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4 text-muted-foreground" />
              {t('charts.conversionFunnel')}
            </CardTitle>
            <CardDescription>{t('charts.conversionFunnelDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsBarChart
              data={charts.conversionFunnel.map((entry) => ({
                ...entry,
                label: t(`charts.funnelStage.${entry.label}` as never),
              }))}
              config={funnelConfig}
              locale={locale}
              emptyMessage={t('charts.noData')}
              layout="vertical"
            />
          </CardContent>
        </Card>
      )}

      {/* Row 5: Rating over time (Line) — full width */}
      {charts.ratingOverTime.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-muted-foreground" />
              {t('charts.ratingOverTime')}
            </CardTitle>
            <CardDescription>{t('charts.ratingOverTimeDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsLineChart
              data={charts.ratingOverTime}
              config={ratingChartConfig}
              locale={locale}
              emptyMessage={t('charts.noData')}
              domain={[0, 5]}
              ticks={[1, 2, 3, 4, 5]}
            />
          </CardContent>
          <CardFooter className="gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 text-yellow-500" />
            {t('charts.rating')}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Role-specific chart panel — uses Radar & Radial for variety
// ---------------------------------------------------------------------------

function RoleSpecificChart({
  charts,
  role,
  locale,
}: {
  charts: AnalyticsCharts;
  role: string;
  locale: string;
}) {
  const t = useTranslations('dashboard.analytics');

  // ── Contractor: Bids by Status → Radar chart ──────────────────────────
  if (role === 'contractor' && charts.bidsByStatus && charts.bidsByStatus.length > 0) {
    const radarData = charts.bidsByStatus.map((entry) => ({
      label: t(`bidStatus.${entry.label}` as never),
      value: entry.value,
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-muted-foreground" />
            {t('charts.bidsByStatus')}
          </CardTitle>
          <CardDescription>{t('charts.bidsByStatusDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <AnalyticsRadarChart
            data={radarData}
            config={bidsRadarConfig}
            emptyMessage={t('charts.noData')}
          />
        </CardContent>
      </Card>
    );
  }

  // ── Contractor: Bid Win Rate → Radial gauge ───────────────────────────
  if (role === 'contractor' && charts.bidWinRateOverTime && charts.bidWinRateOverTime.length > 0) {
    const latest = charts.bidWinRateOverTime[charts.bidWinRateOverTime.length - 1];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-muted-foreground" />
            {t('charts.bidWinRateTrend')}
          </CardTitle>
          <CardDescription>{t('charts.bidWinRateTrendDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <AnalyticsRadialChart
            value={Math.round(latest.value)}
            label={t('charts.winRate')}
            color="var(--chart-4)"
          />
        </CardContent>
        <CardFooter className="gap-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4" />
          {t('charts.winRate')}
        </CardFooter>
      </Card>
    );
  }

  // ── Supplier: Top Products → Horizontal bar ───────────────────────────
  if (role === 'supplier' && charts.topProducts && charts.topProducts.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-muted-foreground" />
            {t('charts.topProducts')}
          </CardTitle>
          <CardDescription>{t('charts.topProductsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <AnalyticsBarChart
            data={charts.topProducts}
            config={topProductsChartConfig}
            locale={locale}
            emptyMessage={t('charts.noData')}
            layout="vertical"
          />
        </CardContent>
      </Card>
    );
  }

  // ── Supplier: Quotations by Status → Radar chart ──────────────────────
  if (role === 'supplier' && charts.quotationsByStatus && charts.quotationsByStatus.length > 0) {
    const radarData = charts.quotationsByStatus.map((entry) => ({
      label: entry.label,
      value: entry.value,
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            {t('charts.quotationsByStatus')}
          </CardTitle>
          <CardDescription>{t('charts.quotationsByStatusDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <AnalyticsRadarChart
            data={radarData}
            config={quotationsRadarConfig}
            emptyMessage={t('charts.noData')}
          />
        </CardContent>
      </Card>
    );
  }

  // ── Project Owner: Projects by Status → Donut chart ───────────────────
  if (role === 'project_owner' && charts.projectsByStatus && charts.projectsByStatus.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PieIcon className="h-4 w-4 text-muted-foreground" />
            {t('charts.projectsByStatus')}
          </CardTitle>
          <CardDescription>{t('charts.projectsByStatusDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <AnalyticsDonutChart
            data={charts.projectsByStatus.map((entry) => ({
              ...entry,
              label: t(`status.${entry.label}` as never),
            }))}
            config={Object.fromEntries(
              charts.projectsByStatus.map((entry) => [
                t(`status.${entry.label}` as never),
                { label: t(`status.${entry.label}` as never), color: entry.color },
              ])
            )}
            emptyMessage={t('charts.noData')}
            totalLabel={t('charts.total')}
          />
        </CardContent>
      </Card>
    );
  }

  // ── Project Owner fallback: Bids Received by Status → Radar chart ────
  if (role === 'project_owner' && charts.bidsReceivedByStatus && charts.bidsReceivedByStatus.length > 0) {
    const radarData = charts.bidsReceivedByStatus.map((entry) => ({
      label: t(`bidStatus.${entry.label}` as never),
      value: entry.value,
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-muted-foreground" />
            {t('charts.bidsReceivedByStatus')}
          </CardTitle>
          <CardDescription>{t('charts.bidsReceivedByStatusDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <AnalyticsRadarChart
            data={radarData}
            config={bidsReceivedRadarConfig}
            emptyMessage={t('charts.noData')}
          />
        </CardContent>
      </Card>
    );
  }

  // ── Fallback ──────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('charts.roleSpecific')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-75 items-center justify-center text-sm text-muted-foreground">
          {t('charts.noData')}
        </div>
      </CardContent>
    </Card>
  );
}
