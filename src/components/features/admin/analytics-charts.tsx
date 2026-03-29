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

const COLORS = [
  'var(--chart-1)', 'var(--chart-3)', 'var(--chart-2)', 'var(--chart-5)',
  'var(--chart-4)', 'var(--info)', 'var(--secondary-dark)', 'var(--success)',
];

interface AnalyticsChartsProps {
  usersByRole: Record<string, number>;
  usersByStatus: Record<string, number>;
  subscriptionsByTier: Record<string, number>;
  recentSignups: { date: string; count: number }[];
  revenueByMonth: { month: string; amount: number }[];
}

const signupChartConfig = {
  count: { label: 'Signups', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const revenueChartConfig = {
  amount: { label: 'Revenue', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const funnelChartConfig = {
  value: { label: 'Users', color: 'var(--chart-4)' },
} satisfies ChartConfig;

export function AnalyticsCharts({
  usersByRole,
  usersByStatus,
  subscriptionsByTier,
  recentSignups,
  revenueByMonth,
}: AnalyticsChartsProps) {
  const t = useTranslations('admin.analyticsPage');

  const roleData = Object.entries(usersByRole).map(([name, value]) => ({ name, value }));
  const statusData = Object.entries(usersByStatus).map(([name, value]) => ({ name, value }));
  const tierData = Object.entries(subscriptionsByTier).map(([name, value]) => ({ name, value }));

  const roleChartConfig = Object.fromEntries(
    roleData.map((entry, i) => [
      entry.name,
      { label: entry.name, color: COLORS[i % COLORS.length] },
    ])
  ) satisfies ChartConfig;

  const tierChartConfig = Object.fromEntries(
    tierData.map((entry, i) => [
      entry.name,
      { label: entry.name, color: COLORS[i % COLORS.length] },
    ])
  ) satisfies ChartConfig;

  return (
    <div className="space-y-6">
      {/* Row 1: User Growth + Users by Role */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('userGrowth')}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSignups.length > 0 ? (
              <ChartContainer config={signupChartConfig} className="min-h-[300px] w-full">
                <LineChart data={recentSignups}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name={t('signups')}
                    stroke="var(--color-count)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">{t('noData')}</p>
            )}
          </CardContent>
        </Card>

        {/* Users by Role Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('usersByRole')}</CardTitle>
          </CardHeader>
          <CardContent>
            {roleData.length > 0 ? (
              <ChartContainer config={roleChartConfig} className="min-h-[300px] w-full">
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {roleData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">{t('noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Revenue + Subscriptions by Tier */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('revenueOverview')}</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByMonth.length > 0 ? (
              <ChartContainer config={revenueChartConfig} className="min-h-[300px] w-full">
                <BarChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => `${Number(value).toLocaleString()} SAR`}
                      />
                    }
                  />
                  <Bar dataKey="amount" name={t('totalRevenue')} fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">{t('noData')}</p>
            )}
          </CardContent>
        </Card>

        {/* Subscriptions by Tier */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('revenueByTier')}</CardTitle>
          </CardHeader>
          <CardContent>
            {tierData.length > 0 ? (
              <ChartContainer config={tierChartConfig} className="min-h-[300px] w-full">
                <PieChart>
                  <Pie
                    data={tierData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {tierData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">{t('noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Registration Funnel (bar chart from statuses) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('registrationFunnel')}</CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length > 0 ? (
            <ChartContainer config={funnelChartConfig} className="min-h-[300px] w-full">
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">{t('noData')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
