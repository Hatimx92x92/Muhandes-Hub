'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#65a30d'];

interface AnalyticsChartsProps {
  usersByRole: Record<string, number>;
  usersByStatus: Record<string, number>;
  subscriptionsByTier: Record<string, number>;
  recentSignups: { date: string; count: number }[];
  revenueByMonth: { month: string; amount: number }[];
}

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
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={recentSignups}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name={t('signups')}
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
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
              <ResponsiveContainer width="100%" height={300}>
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
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
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
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} SAR`, t('totalRevenue')]} />
                  <Bar dataKey="amount" name={t('totalRevenue')} fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
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
              <ResponsiveContainer width="100%" height={300}>
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
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
