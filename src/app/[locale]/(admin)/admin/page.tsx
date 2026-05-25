import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  Users,
  FileText,
  Handshake,
  Banknote,
  AlertTriangle,
  TrendingUp,
  Clock,
  Star,
  ClipboardList,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminStatValue } from '@/components/features/admin/admin-stat-value';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function AdminDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const adminClient = createAdminClient();

  // Fetch admin stats in parallel using admin client (bypasses RLS)
  const [
    { count: totalUsers },
    { count: pendingPosts },
    { count: activeDeals },
    { count: pendingCommissions },
    { count: disputedCommissions },
    { count: pendingDocs },
    { count: totalRevenue },
    { data: recentAudit },
  ] = await Promise.all([
    db(adminClient).from('profiles').select('id', { count: 'exact' }),
    db(adminClient).from('projects').select('id', { count: 'exact' }).eq('status', 'pending'),
    db(adminClient).from('deals').select('id', { count: 'exact' }).in('status', ['active', 'in_progress']),
    db(adminClient).from('commissions').select('id', { count: 'exact' }).eq('status', 'pending'),
    db(adminClient).from('commissions').select('id', { count: 'exact' }).eq('status', 'disputed'),
    db(adminClient).from('verification_documents').select('id', { count: 'exact' }).eq('status', 'pending'),
    db(adminClient).from('commissions').select('id', { count: 'exact' }).eq('status', 'paid'),
    db(adminClient).from('admin_audit_log').select('id, action, target_type, created_at').order('created_at', { ascending: false }).limit(10),
  ]);

  const stats = [
    { label: t('stats.users'), value: totalUsers ?? 0, icon: Users, href: '/admin/users', color: 'bg-primary/10 text-primary' },
    { label: t('stats.pendingPosts'), value: pendingPosts ?? 0, icon: FileText, href: '/admin/posts', color: 'bg-status-pending/10 text-status-pending' },
    { label: t('stats.activeDeals'), value: activeDeals ?? 0, icon: Handshake, href: '/admin/deals', color: 'bg-status-active/10 text-status-active' },
    { label: t('stats.pendingCommissions'), value: pendingCommissions ?? 0, icon: Banknote, href: '/admin/commissions', color: 'bg-status-pending/10 text-status-pending' },
    { label: t('stats.disputes'), value: disputedCommissions ?? 0, icon: AlertTriangle, href: '/admin/commissions?status=disputed', color: 'bg-destructive/10 text-destructive' },
    { label: t('stats.pendingDocs'), value: pendingDocs ?? 0, icon: Clock, href: '/admin/users?filter=pending_docs', color: 'bg-secondary/50 text-secondary-foreground' },
    { label: t('stats.paidCommissions'), value: totalRevenue ?? 0, icon: TrendingUp, href: '/admin/commissions?status=paid', color: 'bg-status-completed/10 text-status-completed' },
  ];



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20">
              <CardContent className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-extrabold"><AdminStatValue value={stat.value} /></p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              {t('needsReview')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(pendingPosts ?? 0) > 0 && (
              <Link href="/admin/posts" className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted">
                <span className="text-sm">{t('pendingPostsAwait')}</span>
                <Badge variant="pending">{pendingPosts}</Badge>
              </Link>
            )}
            {(pendingDocs ?? 0) > 0 && (
              <Link href="/admin/users?filter=pending_docs" className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted">
                <span className="text-sm">{t('pendingDocsReview')}</span>
                <Badge variant="warning">{pendingDocs}</Badge>
              </Link>
            )}
            {(disputedCommissions ?? 0) > 0 && (
              <Link href="/admin/commissions?status=disputed" className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted">
                <span className="text-sm">{t('commissionDisputes')}</span>
                <Badge variant="destructive">{disputedCommissions}</Badge>
              </Link>
            )}
            {(pendingPosts ?? 0) === 0 && (pendingDocs ?? 0) === 0 && (disputedCommissions ?? 0) === 0 && (
              <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                <Star className="h-4 w-4" />
                <span>{t('noPendingItems')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Audit Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
                {t('recentOperations')}
              </span>
              <Link href="/admin/audit-log" className="text-sm font-normal text-primary hover:underline">
                {t('viewAll')}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(recentAudit && recentAudit.length > 0) ? (
              <div className="space-y-2">
                {recentAudit.map((entry: Record<string, unknown>) => (
                  <div key={entry.id as string} className="flex items-center justify-between text-sm">
                    <span>{t(`auditActions.${entry.action as string}`, { defaultMessage: (entry.action as string).replace(/_/g, ' ') })}</span>
                    <time className="text-xs text-muted-foreground">
                      {new Date(entry.created_at as string).toLocaleDateString(locale)}
                    </time>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('noOperationsYet')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
