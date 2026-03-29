'use client';

import {
  FolderKanban,
  FileText,
  TrendingUp,
  Clock,
  Package,
  Receipt,
  Target,
  Inbox,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { RoleStats } from '@/actions/analytics';

interface AnalyticsRoleStatsProps {
  roleStats: RoleStats;
  locale: string;
}

export function AnalyticsRoleStats({ roleStats, locale }: AnalyticsRoleStatsProps) {
  const t = useTranslations('dashboard.analytics');
  const fmt = (n: number) => n.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-SA');

  let cards: { key: string; label: string; value: string; icon: typeof FolderKanban; color: string; highlight?: boolean }[] = [];

  if (roleStats.role === 'contractor') {
    const s = roleStats.stats;
    cards = [
      { key: 'projects', label: t('role.projects'), value: fmt(s.projects), icon: FolderKanban, color: 'bg-info/10 text-info' },
      { key: 'bids', label: t('role.bids'), value: fmt(s.bids), icon: FileText, color: 'bg-accent-indigo/10 text-accent-indigo-foreground' },
      { key: 'bidWinRate', label: t('role.bidWinRate'), value: `${s.bidWinRate}%`, icon: Target, color: 'bg-success/10 text-success', highlight: s.bidWinRate >= 50 },
      { key: 'avgBidToAward', label: t('role.avgBidToAward'), value: s.avgBidToAwardDays !== null ? `${s.avgBidToAwardDays}d` : '—', icon: Clock, color: 'bg-warning/10 text-warning' },
    ];
  } else if (roleStats.role === 'supplier') {
    const s = roleStats.stats;
    cards = [
      { key: 'products', label: t('role.products'), value: fmt(s.products), icon: Package, color: 'bg-info/10 text-info' },
      { key: 'quotations', label: t('role.quotations'), value: fmt(s.quotations), icon: Receipt, color: 'bg-accent-indigo/10 text-accent-indigo-foreground' },
      { key: 'conversionRate', label: t('role.conversionRate'), value: `${s.quotationConversionRate}%`, icon: TrendingUp, color: 'bg-success/10 text-success', highlight: s.quotationConversionRate >= 50 },
      { key: 'inquiries', label: t('role.inquiries'), value: fmt(s.inquiries), icon: Inbox, color: 'bg-warning/10 text-warning' },
    ];
  } else if (roleStats.role === 'project_owner') {
    const s = roleStats.stats;
    cards = [
      { key: 'projects', label: t('role.projects'), value: fmt(s.projects), icon: FolderKanban, color: 'bg-info/10 text-info' },
      { key: 'rfqs', label: t('role.rfqs'), value: fmt(s.rfqs), icon: ShoppingCart, color: 'bg-accent-indigo/10 text-accent-indigo-foreground' },
      { key: 'bidsReceived', label: t('role.bidsReceived'), value: fmt(s.totalBidsReceived), icon: FileText, color: 'bg-success/10 text-success' },
      { key: 'avgBidsPerProject', label: t('role.avgBidsPerProject'), value: fmt(s.avgBidsPerProject), icon: Users, color: 'bg-warning/10 text-warning' },
    ];
  } else {
    // buyer
    const s = roleStats.stats;
    cards = [
      { key: 'rfqs', label: t('role.rfqs'), value: fmt(s.rfqs), icon: ShoppingCart, color: 'bg-info/10 text-info' },
      { key: 'deals', label: t('role.deals'), value: fmt(s.deals), icon: FileText, color: 'bg-success/10 text-success' },
    ];
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {t('rolePerformance')}
      </h3>
      <div className={cn(
        'grid gap-4',
        cards.length <= 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4',
      )}>
        {cards.map(({ key, label, value, icon: Icon, color, highlight }) => (
          <div
            key={key}
            className={cn(
              'rounded-xl border bg-card p-4 transition-shadow hover:shadow-md',
              highlight ? 'border-success/30' : 'border-border',
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
