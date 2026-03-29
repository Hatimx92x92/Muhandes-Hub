'use client';

import {
  Handshake,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Activity,
  XCircle,
  DollarSign,
  Star,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { AnalyticsKpi, AnalyticsTrends } from '@/actions/analytics';

interface AnalyticsKpiCardsProps {
  kpi: AnalyticsKpi;
  trends: AnalyticsTrends;
  locale: string;
  period: string;
}

const kpiConfig = [
  { key: 'totalDeals', icon: Handshake, color: 'bg-primary/10 text-primary', href: '/dashboard/deals' },
  { key: 'completedDeals', icon: CheckCircle2, color: 'bg-success/10 text-success', href: '/dashboard/deals?status=completed' },
  { key: 'activeDeals', icon: Activity, color: 'bg-info/10 text-info', href: '/dashboard/deals?status=active' },
  { key: 'totalRevenue', icon: DollarSign, color: 'bg-warning/10 text-warning', href: '/dashboard/deals' },
  { key: 'avgRating', icon: Star, color: 'bg-warning/10 text-warning', href: undefined },
  { key: 'totalReviews', icon: MessageSquare, color: 'bg-accent-purple/10 text-accent-purple-foreground', href: undefined },
  { key: 'cancelledDeals', icon: XCircle, color: 'bg-destructive/10 text-destructive', href: '/dashboard/deals?status=cancelled' },
] as const;

export function AnalyticsKpiCards({ kpi, trends, locale, period }: AnalyticsKpiCardsProps) {
  const t = useTranslations('dashboard.analytics');

  const formatValue = (key: string, value: number): string => {
    if (key === 'totalRevenue') {
      return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    if (key === 'avgRating') {
      return value > 0 ? value.toFixed(1) : '—';
    }
    return value.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-SA');
  };

  const getTrend = (key: string): number | null => {
    if (key === 'totalDeals' || key === 'completedDeals' || key === 'activeDeals' || key === 'cancelledDeals') return trends.deals;
    if (key === 'totalRevenue') return trends.revenue;
    if (key === 'avgRating') return trends.rating;
    return null;
  };

  // Show top 4 KPIs for a clean grid
  const visibleKpis = kpiConfig.slice(0, 4);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {visibleKpis.map(({ key, icon: Icon, color, href }) => {
        const value = kpi[key as keyof AnalyticsKpi];
        const trend = getTrend(key);

        const card = (
          <div
            key={key}
            className={cn(
              'group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md',
              href && 'cursor-pointer',
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {t(`kpi.${key}` as never)}
              </p>
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', color)}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">
              {formatValue(key, value)}
            </p>
            {trend !== null && period !== 'all' && (
              <div className="mt-1.5 flex items-center gap-1">
                {trend >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                )}
                <span
                  className={cn(
                    'text-xs font-semibold',
                    trend >= 0
                      ? 'text-success'
                      : 'text-destructive',
                  )}
                >
                  {trend >= 0 ? '+' : ''}{trend}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('vsLastPeriod')}
                </span>
              </div>
            )}
            {/* Subtle gradient accent */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 opacity-0 transition-opacity group-hover:opacity-100"
              style={{ background: 'linear-gradient(90deg, var(--color-primary), transparent)' }}
            />
          </div>
        );

        return href ? (
          <Link key={key} href={href} className="block">
            {card}
          </Link>
        ) : card;
      })}
    </div>
  );
}

// Secondary row: extended KPIs (rating, reviews, cancelled)
export function AnalyticsKpiSecondary({ kpi, locale }: { kpi: AnalyticsKpi; locale: string }) {
  const t = useTranslations('dashboard.analytics');

  const items = [
    { key: 'avgRating', icon: Star, color: 'bg-warning/10 text-warning', value: kpi.avgRating > 0 ? kpi.avgRating.toFixed(1) : '—' },
    { key: 'totalReviews', icon: MessageSquare, color: 'bg-accent-purple/10 text-accent-purple-foreground', value: kpi.totalReviews.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-SA') },
    { key: 'cancelledDeals', icon: XCircle, color: 'bg-destructive/10 text-destructive', value: kpi.cancelledDeals.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-SA') },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map(({ key, icon: Icon, color, value }) => (
        <div key={key} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', color)}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t(`kpi.${key}` as never)}</p>
              <p className="text-lg font-bold">{value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
