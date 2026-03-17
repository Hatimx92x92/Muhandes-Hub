import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Handshake,
  FileText,
  Package,
  Gavel,
  DollarSign,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { getPlatformAnalytics } from '@/actions/admin/analytics';
import { AnalyticsCharts } from '@/components/features/admin/analytics-charts';

export default async function AdminAnalyticsPage() {
  const t = await getTranslations('admin.analyticsPage');
  const locale = await getLocale();

  const { data, error } = await getPlatformAnalytics();
  if (error || !data) redirect('/admin');

  const { totals, usersByRole, usersByStatus, subscriptionsByTier, recentSignups, revenueByMonth } = data;

  const statCards = [
    { label: t('totalUsers'), value: totals.totalUsers, icon: Users, color: 'text-blue-600' },
    { label: t('activeUsers'), value: totals.activeUsers, icon: TrendingUp, color: 'text-green-600' },
    { label: t('newUsersThisMonth'), value: totals.newUsersThisMonth, icon: UserPlus, color: 'text-purple-600' },
    { label: t('totalRevenue'), value: `${totals.totalRevenue.toLocaleString(locale)} SAR`, icon: DollarSign, color: 'text-amber-600' },
    { label: t('deals'), value: totals.totalDeals, icon: Handshake, color: 'text-indigo-600' },
    { label: t('projects'), value: totals.totalProjects, icon: FileText, color: 'text-cyan-600' },
    { label: t('products'), value: totals.totalProducts, icon: Package, color: 'text-pink-600' },
    { label: t('bids'), value: totals.totalBids, icon: Gavel, color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 pt-4">
              <div className={`rounded-lg bg-muted p-2 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <AnalyticsCharts
        usersByRole={usersByRole}
        usersByStatus={usersByStatus}
        subscriptionsByTier={subscriptionsByTier}
        recentSignups={recentSignups}
        revenueByMonth={revenueByMonth}
      />
    </div>
  );
}
