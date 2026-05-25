// =============================================================================
// Supplier Dashboard — paid role, focused on products, quotations, inquiries
// =============================================================================

import { Link } from '@/i18n/navigation';
import {
  Package,
  Receipt,
  Handshake,
  Star,
  Inbox,
  ShoppingCart,
  BarChart3,
} from 'lucide-react';
import { StatCard } from '@/components/features/stat-card';
import { DashboardActivityFeed } from '@/components/features/dashboard-activity-feed';
import type { DashboardActivityItem } from '@/actions/analytics';

interface QuickActionProps {
  label: string;
  href: string;
  icon: React.ElementType;
}

function QuickAction({ label, href, icon: Icon }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/15">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </Link>
  );
}

interface SupplierDashboardProps {
  counts: Record<string, number>;
  activities: DashboardActivityItem[];
  locale: string;
  subscriptionTier?: string | null;
  t: (key: string) => string;
  tStats: (key: string) => string;
  tActions: (key: string) => string;
}

export function SupplierDashboard({
  counts,
  activities,
  locale,
  subscriptionTier,
  t,
  tStats,
  tActions,
}: SupplierDashboardProps) {
  const stats = [
    { label: tStats('products'), value: counts.products ?? 0, icon: Package, href: '/dashboard/products' },
    { label: tStats('quotations'), value: counts.quotations ?? 0, icon: Receipt, href: '/dashboard/quotations' },
    { label: tStats('inquiries'), value: counts.inquiries ?? 0, icon: Inbox, href: '/dashboard/inquiries' },
    { label: tStats('deals'), value: counts.deals ?? 0, icon: Handshake, href: '/dashboard/deals' },
  ];

  const quickActions = [
    { label: tActions('newProduct'), href: '/dashboard/products/new', icon: Package },
    { label: tActions('browseRfqs'), href: '/dashboard/rfqs', icon: ShoppingCart },
    { label: tActions('viewAnalytics'), href: '/dashboard/analytics', icon: BarChart3 },
  ];

  return (
    <>
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={<stat.icon className="h-5 w-5" />}
            href={stat.href}
          />
        ))}
      </div>

      {/* Quick actions + Activity feed */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">{t('quickActions')}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <QuickAction
                key={action.label}
                label={action.label}
                href={action.href}
                icon={action.icon}
              />
            ))}
          </div>
        </div>
        <DashboardActivityFeed activities={activities} locale={locale} />
      </div>

      {/* Subscription tier card — always shown for paid roles */}
      {subscriptionTier && (
        <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t('currentSubscription')}</p>
            <p className="font-bold text-foreground capitalize">{subscriptionTier}</p>
          </div>
          <Link
            href="/dashboard/subscription"
            className="text-sm font-semibold text-primary hover:underline"
          >
            {t('manageSubscription')}
          </Link>
        </div>
      )}
    </>
  );
}
