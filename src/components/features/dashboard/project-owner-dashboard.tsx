// =============================================================================
// Project Owner Dashboard — free role, focused on projects, bids, RFQs
// =============================================================================

import { Link } from '@/i18n/navigation';
import {
  FolderKanban,
  Handshake,
  ShoppingCart,
  Star,
  FileText,
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

interface ProjectOwnerDashboardProps {
  counts: Record<string, number>;
  activities: DashboardActivityItem[];
  locale: string;
  t: (key: string) => string;
  tStats: (key: string) => string;
  tActions: (key: string) => string;
}

export function ProjectOwnerDashboard({
  counts,
  activities,
  locale,
  t,
  tStats,
  tActions,
}: ProjectOwnerDashboardProps) {
  const stats = [
    { label: tStats('activeProjects'), value: counts.projects ?? 0, icon: FolderKanban, href: '/dashboard/projects' },
    { label: tStats('bidsReceived'), value: counts.bids ?? 0, icon: FolderKanban, href: '/dashboard/bids' },
    { label: tStats('activeDeals'), value: counts.deals ?? 0, icon: Handshake, href: '/dashboard/deals' },
    { label: tStats('rfqs'), value: counts.rfqs ?? 0, icon: ShoppingCart, href: '/dashboard/rfqs' },
  ];

  const quickActions = [
    { label: tActions('newProject'), href: '/dashboard/projects/new', icon: FolderKanban },
    { label: tActions('newRfq'), href: '/dashboard/rfqs/new', icon: ShoppingCart },
    { label: tActions('viewContracts'), href: '/dashboard/contracts', icon: FileText },
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
    </>
  );
}
