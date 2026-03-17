// =============================================================================
// Dashboard Overview Page — role-specific stat cards + quick actions
// =============================================================================

import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import {
  LayoutDashboard,
  FolderKanban,
  Package,
  Handshake,
  Receipt,
  ShoppingCart,
  Star,
  FileText,
  ArrowUpLeft,
} from 'lucide-react';
import type { UserRole } from '@/types';

// ---------------------------------------------------------------------------
// Stat card component
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/15">
          <Icon className="h-5 w-5" />
        </div>
        <ArrowUpLeft className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
      </div>
      <p className="mt-4 text-2xl font-extrabold text-foreground">{value}</p>
      <p className="mt-1 text-sm font-medium text-muted-foreground">{label}</p>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Quick action button
// ---------------------------------------------------------------------------

function QuickAction({
  label,
  href,
  icon: Icon,
}: {
  label: string;
  href: string;
  icon: React.ElementType;
}) {
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

// ---------------------------------------------------------------------------
// Role-specific config
// ---------------------------------------------------------------------------

interface DashboardConfig {
  stats: { label: string; value: string; icon: React.ElementType; href: string }[];
  quickActions: { label: string; href: string; icon: React.ElementType }[];
}

function getDashboardConfig(role: UserRole, tStats: (key: string) => string, tActions: (key: string) => string): DashboardConfig {
  switch (role) {
    case 'project_owner':
      return {
        stats: [
          { label: tStats('activeProjects'), value: '—', icon: FolderKanban, href: '/dashboard/projects' },
          { label: tStats('activeDeals'), value: '—', icon: Handshake, href: '/dashboard/deals' },
          { label: tStats('rfqs'), value: '—', icon: ShoppingCart, href: '/dashboard/rfqs' },
          { label: tStats('reviews'), value: '—', icon: Star, href: '/dashboard/reviews' },
        ],
        quickActions: [
          { label: tActions('newProject'), href: '/dashboard/projects/new', icon: FolderKanban },
          { label: tActions('newRfq'), href: '/dashboard/rfqs/new', icon: ShoppingCart },
          { label: tActions('viewContracts'), href: '/dashboard/contracts', icon: FileText },
        ],
      };
    case 'contractor':
      return {
        stats: [
          { label: tStats('projects'), value: '—', icon: FolderKanban, href: '/dashboard/projects' },
          { label: tStats('submittedBids'), value: '—', icon: Receipt, href: '/dashboard/quotations' },
          { label: tStats('activeDealsShort'), value: '—', icon: Handshake, href: '/dashboard/deals' },
          { label: tStats('reviews'), value: '—', icon: Star, href: '/dashboard/reviews' },
        ],
        quickActions: [
          { label: tActions('postProject'), href: '/dashboard/projects/new', icon: FolderKanban },
          { label: tActions('browseProjects'), href: '/projects', icon: FolderKanban },
          { label: tActions('newQuotation'), href: '/dashboard/quotations/new', icon: Receipt },
        ],
      };
    case 'supplier':
      return {
        stats: [
          { label: tStats('products'), value: '—', icon: Package, href: '/dashboard/products' },
          { label: tStats('quotations'), value: '—', icon: Receipt, href: '/dashboard/quotations' },
          { label: tStats('deals'), value: '—', icon: Handshake, href: '/dashboard/deals' },
          { label: tStats('reviews'), value: '—', icon: Star, href: '/dashboard/reviews' },
        ],
        quickActions: [
          { label: tActions('newProduct'), href: '/dashboard/products/new', icon: Package },
          { label: tActions('browseRfqs'), href: '/dashboard/rfqs', icon: ShoppingCart },
          { label: tActions('newQuotation'), href: '/dashboard/quotations/new', icon: Receipt },
        ],
      };
    case 'buyer':
      return {
        stats: [
          { label: tStats('rfqs'), value: '—', icon: ShoppingCart, href: '/dashboard/rfqs' },
          { label: tStats('deals'), value: '—', icon: Handshake, href: '/dashboard/deals' },
          { label: tStats('reviews'), value: '—', icon: Star, href: '/dashboard/reviews' },
          { label: tStats('contracts'), value: '—', icon: FileText, href: '/dashboard/contracts' },
        ],
        quickActions: [
          { label: tActions('newRfq'), href: '/dashboard/rfqs/new', icon: ShoppingCart },
          { label: tActions('browseProducts'), href: '/marketplace', icon: Package },
        ],
      };
    default:
      return { stats: [], quickActions: [] };
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const t = await getTranslations('dashboard');
  const tStats = await getTranslations('dashboard.stats');
  const tActions = await getTranslations('dashboard.actions');

  // Fetch user role
  const db = supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (f: string, v: string) => {
          single: () => Promise<{ data: { role: string; full_name: string } | null }>;
        };
      };
    };
  };

  const { data: profile } = await db
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  const role = (profile?.role as UserRole) || 'buyer';
  const config = getDashboardConfig(role, tStats, tActions);
  const greeting = profile?.full_name
    ? t('greeting', { name: profile.full_name })
    : t('greetingDefault');

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">{greeting}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('overview')}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {config.stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            href={stat.href}
          />
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">{t('quickActions')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {config.quickActions.map((action) => (
            <QuickAction
              key={action.label}
              label={action.label}
              href={action.href}
              icon={action.icon}
            />
          ))}
        </div>
      </div>

      {/* Subscription tier badge */}
      {profile?.subscription_tier && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t('currentSubscription')}</p>
            <p className="font-bold text-foreground capitalize">{profile.subscription_tier}</p>
          </div>
          <Link
            href="/dashboard/subscription"
            className="text-sm font-semibold text-primary hover:underline"
          >
            {t('manageSubscription')}
          </Link>
        </div>
      )}
    </div>
  );
}
