'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import type { AnalyticsCharts } from '@/actions/analytics';
import { Activity, DollarSign, PieChart as PieIcon, Star, Target, Package, Receipt } from 'lucide-react';

interface AnalyticsUserChartsProps {
  charts: AnalyticsCharts;
  role: string;
  locale: string;
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

const dealsChartConfig = {
  value: { label: 'Deals', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const revenueChartConfig = {
  value: { label: 'Revenue', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const ratingChartConfig = {
  value: { label: 'Rating', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const winRateChartConfig = {
  value: { label: 'Win Rate', color: 'var(--chart-4)' },
} satisfies ChartConfig;

const topProductsChartConfig = {
  value: { label: 'Views', color: 'var(--chart-1)' },
} satisfies ChartConfig;

export function AnalyticsUserCharts({ charts, role, locale }: AnalyticsUserChartsProps) {
  const t = useTranslations('dashboard.analytics');
  const isRTL = locale === 'ar';

  const formatSAR = (value: number) =>
    new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-6">
      {/* Row 1: Deals over time + Revenue trend */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Deals Over Time — Area Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-muted-foreground" />
              {t('charts.dealsOverTime')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {charts.dealsOverTime.length > 0 ? (
              <ChartContainer config={dealsChartConfig} className="min-h-[280px] w-full">
                <AreaChart data={charts.dealsOverTime}>
                  <defs>
                    <linearGradient id="dealsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    reversed={isRTL}
                  />
                  <YAxis tick={{ fontSize: 11 }} orientation={isRTL ? 'right' : 'left'} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name={t('charts.deals')}
                    stroke="var(--color-value)"
                    strokeWidth={2}
                    fill="url(#dealsGradient)"
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <EmptyChart message={t('charts.noData')} />
            )}
          </CardContent>
        </Card>

        {/* Revenue Trend — Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              {t('charts.revenueTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {charts.revenueOverTime.length > 0 ? (
              <ChartContainer config={revenueChartConfig} className="min-h-[280px] w-full">
                <BarChart data={charts.revenueOverTime}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} reversed={isRTL} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    orientation={isRTL ? 'right' : 'left'}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatSAR(value as number)}
                      />
                    }
                  />
                  <Bar
                    dataKey="value"
                    name={t('charts.revenue')}
                    fill="url(#revenueGradient)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyChart message={t('charts.noData')} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Deals by Status + Role-specific chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Deals by Status — Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieIcon className="h-4 w-4 text-muted-foreground" />
              {t('charts.dealsByStatus')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {charts.dealsByStatus.length > 0 ? (
              <ChartContainer
                config={Object.fromEntries(
                  charts.dealsByStatus.map((entry) => [
                    entry.label,
                    { label: t(`status.${entry.label}` as never), color: entry.color },
                  ])
                )}
                className="min-h-[280px] w-full"
              >
                <PieChart>
                  <Pie
                    data={charts.dealsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="label"
                    label={({ name, value }) => `${t(`status.${name}` as never)}: ${value}`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {charts.dealsByStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <span>{t(`status.${name}` as never)}: {value as number}</span>
                        )}
                      />
                    }
                  />
                  <ChartLegend
                    content={<ChartLegendContent />}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyChart message={t('charts.noData')} />
            )}
          </CardContent>
        </Card>

        {/* Role-specific chart */}
        <RoleSpecificChart charts={charts} role={role} locale={locale} />
      </div>

      {/* Row 3: Rating over time */}
      {charts.ratingOverTime.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-muted-foreground" />
              {t('charts.ratingOverTime')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={ratingChartConfig} className="min-h-[250px] w-full">
              <LineChart data={charts.ratingOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} reversed={isRTL} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  orientation={isRTL ? 'right' : 'left'}
                  domain={[0, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={t('charts.rating')}
                  stroke="var(--color-value)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#eab308' }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Role-specific chart panel
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
  const isRTL = locale === 'ar';

  if (role === 'contractor' && charts.bidsByStatus && charts.bidsByStatus.length > 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-muted-foreground" />
            {t('charts.bidsByStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={Object.fromEntries(
              charts.bidsByStatus.map((entry) => [
                entry.label,
                { label: t(`bidStatus.${entry.label}` as never), color: entry.color },
              ])
            )}
            className="min-h-[280px] w-full"
          >
            <PieChart>
              <Pie
                data={charts.bidsByStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                nameKey="label"
                label={({ name, value }) => `${t(`bidStatus.${name}` as never)}: ${value}`}
                labelLine={{ strokeWidth: 1 }}
              >
                {charts.bidsByStatus.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <span>{t(`bidStatus.${name}` as never)}: {value as number}</span>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }

  if (role === 'contractor' && charts.bidWinRateOverTime && charts.bidWinRateOverTime.length > 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-muted-foreground" />
            {t('charts.bidWinRateTrend')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={winRateChartConfig} className="min-h-[280px] w-full">
            <LineChart data={charts.bidWinRateOverTime}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} reversed={isRTL} />
              <YAxis
                tick={{ fontSize: 11 }}
                orientation={isRTL ? 'right' : 'left'}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `${value}%`}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                name={t('charts.winRate')}
                stroke="var(--color-value)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#7c3aed' }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }

  if (role === 'supplier' && charts.topProducts && charts.topProducts.length > 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-muted-foreground" />
            {t('charts.topProducts')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={topProductsChartConfig} className="min-h-[280px] w-full">
            <BarChart data={charts.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis
                dataKey="label"
                type="category"
                tick={{ fontSize: 11 }}
                width={120}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }

  if (role === 'supplier' && charts.quotationsByStatus && charts.quotationsByStatus.length > 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            {t('charts.quotationsByStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={Object.fromEntries(
              charts.quotationsByStatus.map((entry) => [
                entry.label,
                { label: entry.label, color: entry.color },
              ])
            )}
            className="min-h-[280px] w-full"
          >
            <PieChart>
              <Pie
                data={charts.quotationsByStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                nameKey="label"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={{ strokeWidth: 1 }}
              >
                {charts.quotationsByStatus.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }

  // Fallback — empty card
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('charts.roleSpecific')}</CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyChart message={t('charts.noData')} />
      </CardContent>
    </Card>
  );
}
