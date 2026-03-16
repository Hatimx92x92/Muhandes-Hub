import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote } from 'lucide-react';
import { AdminCommissionActions } from '@/components/features/admin/commission-actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

const commissionStatusVariant: Record<string, string> = {
  pending: 'pending',
  approved: 'info',
  paid: 'completed',
  disputed: 'destructive',
  overdue: 'warning',
};

export default async function AdminCommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const t = await getTranslations('admin');
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const statusFilter = params.status ?? 'all';

  let query = db(supabase)
    .from('commissions')
    .select('id, deal_id, seller_id, amount, vat_amount, total, status, due_date, paid_at, dispute_reason, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: commissions } = await query;

  // Stats
  const { count: pendingCount } = await db(supabase)
    .from('commissions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
  const { count: disputedCount } = await db(supabase)
    .from('commissions').select('*', { count: 'exact', head: true }).eq('status', 'disputed');
  const { count: overdueCount } = await db(supabase)
    .from('commissions').select('*', { count: 'exact', head: true }).eq('status', 'overdue');

  const statuses = ['all', 'pending', 'approved', 'paid', 'disputed', 'overdue'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('commissionsPage.title')}</h1>
        <p className="text-muted-foreground">{t('commissionsPage.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('commissionsPage.pendingPayment')}</p>
            <p className="text-2xl font-bold text-status-pending">{pendingCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('commissionsPage.disputes')}</p>
            <p className="text-2xl font-bold text-destructive">{disputedCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{t('commissionsPage.overdue')}</p>
            <p className="text-2xl font-bold text-warning">{overdueCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <a
            key={s}
            href={`/admin/commissions?status=${s}`}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s === 'all' ? t('all') : t(`commissionStatus.${s}`)}
          </a>
        ))}
      </div>

      {/* Commissions list */}
      {!commissions || commissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Banknote className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">{t('commissionsPage.noCommissions')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(commissions as Record<string, unknown>[]).map((commission) => (
            <Card key={commission.id as string}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">
                    {t('commissionsPage.commissionPrefix')} #{(commission.id as string).slice(0, 8)}
                  </CardTitle>
                  <Badge variant={commissionStatusVariant[commission.status as string] as 'pending' | 'completed' | 'destructive' | 'warning' | 'info'}>
                    {t(`commissionStatus.${commission.status as string}`)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('commissionsPage.amount')}</p>
                    <p className="font-semibold">{Number(commission.amount ?? 0).toLocaleString(locale)} {t('sar')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('commissionsPage.vat')}</p>
                    <p className="font-semibold">{Number(commission.vat_amount ?? 0).toLocaleString(locale)} {t('sar')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('commissionsPage.total')}</p>
                    <p className="font-semibold">{Number(commission.total ?? 0).toLocaleString(locale)} {t('sar')}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('commissionsPage.dueDate')} {commission.due_date ? new Date(commission.due_date as string).toLocaleDateString(locale) : '—'}</span>
                  <span>{new Date(commission.created_at as string).toLocaleDateString(locale)}</span>
                </div>

                {!!commission.dispute_reason && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm dark:bg-red-900/20">
                    <p className="font-medium text-red-700 dark:text-red-400">{t('commissionsPage.disputeReason')}</p>
                    <p className="text-red-600 dark:text-red-300">{commission.dispute_reason as string}</p>
                  </div>
                )}

                {(commission.status === 'pending' || commission.status === 'approved' || commission.status === 'disputed') && (
                  <AdminCommissionActions
                    commissionId={commission.id as string}
                    currentStatus={commission.status as string}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
