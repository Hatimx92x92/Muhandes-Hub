import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Banknote, Clock, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/features/empty-state';
import { CommissionActions } from '@/components/features/commissions/commission-actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

const STATUS_VARIANTS: Record<string, 'pending' | 'success' | 'warning' | 'destructive' | 'info'> = {
  pending: 'pending',
  approved: 'info',
  paid: 'success',
  disputed: 'warning',
  overdue: 'destructive',
};

function formatSAR(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'SAR' }).format(amount);
}

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filterStatus } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.commissions');
  const tCommon = await getTranslations('dashboard.common');
  const locale = await getLocale();

  // Fetch commissions for seller
  let query = db(supabase)
    .from('commissions')
    .select('*, deal:deal_id(title_ar, title_en)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  if (filterStatus && ['pending', 'approved', 'paid', 'disputed', 'overdue'].includes(filterStatus)) {
    query = query.eq('status', filterStatus);
  }

  const { data: commissions } = await query;
  const items = (commissions ?? []) as Record<string, unknown>[];

  // Calculate stats
  const totalPending = items
    .filter((c) => c.status === 'pending' || c.status === 'overdue')
    .reduce((sum, c) => sum + Number(c.total ?? 0), 0);
  const totalPaid = items
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.total ?? 0), 0);
  const overdueCount = items.filter((c) => c.status === 'overdue').length;
  const paidCount = items.filter((c) => c.status === 'paid').length;

  const statuses = ['pending', 'approved', 'paid', 'disputed', 'overdue'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-status-pending/10">
              <Clock className="h-5 w-5 text-status-pending" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('pendingAmount')}</p>
              <p className="text-xl font-extrabold">{formatSAR(totalPending, locale)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-status-completed/10">
              <CheckCircle className="h-5 w-5 text-status-completed" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('paidAmount')}</p>
              <p className="text-xl font-extrabold">{formatSAR(totalPaid, locale)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Banknote className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('paidCount')}</p>
              <p className="text-xl font-extrabold">{paidCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('overdueCount')}</p>
              <p className="text-xl font-extrabold">{overdueCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter badges */}
      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/commissions">
          <Badge variant={!filterStatus ? 'default' : 'outline'}>{tCommon('all')} ({items.length})</Badge>
        </Link>
        {statuses.map((s) => {
          const count = items.filter((c) => c.status === s).length;
          return (
            <Link key={s} href={`/dashboard/commissions?status=${s}`}>
              <Badge variant={filterStatus === s ? 'default' : 'outline'}>
                {t(`status.${s}` as never)} ({count})
              </Badge>
            </Link>
          );
        })}
      </div>

      {/* Commission list */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Banknote className="h-12 w-12" />}
          title={t('noCommissions')}
          description={t('noCommissionsDesc')}
          actionLabel={t('viewDeals')}
          actionHref="/dashboard/deals"
        />
      ) : (
        <div className="space-y-4">
          {items.map((commission) => {
            const dealTitle = (commission.deal as Record<string, unknown> | null)?.title_ar as string | undefined;
            const dueDate = commission.due_date ? new Date(commission.due_date as string) : null;
            const isOverdue = dueDate && dueDate < new Date() && commission.status === 'pending';
            const canPay = commission.status === 'pending' || commission.status === 'overdue';
            const canDispute =
              (commission.status === 'pending' || commission.status === 'overdue') &&
              new Date(commission.created_at as string).getTime() + 7 * 24 * 60 * 60 * 1000 > Date.now();

            return (
              <Card key={commission.id as string} className={isOverdue ? 'border-destructive/50' : ''}>
                <CardContent className="space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {dealTitle ?? t('dealNumber', { id: (commission.deal_id as string).slice(0, 8) })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('commissionRate', { rate: commission.rate as number })}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANTS[commission.status as string] ?? 'secondary'}>
                      {t(`status.${commission.status}` as never) ?? commission.status}
                    </Badge>
                  </div>

                  {/* Amounts */}
                  <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-muted-foreground">{t('dealValue')}</p>
                      <p className="font-semibold">{formatSAR(Number(commission.deal_value), locale)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('commission')}</p>
                      <p className="font-semibold">{formatSAR(Number(commission.amount), locale)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('vat15')}</p>
                      <p className="font-semibold">{formatSAR(Number(commission.vat_amount), locale)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('total')}</p>
                      <p className="font-bold text-primary">{formatSAR(Number(commission.total), locale)}</p>
                    </div>
                  </div>

                  {/* Due date + dispute info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {dueDate && (
                      <span className={isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                        {isOverdue ? `${t('paymentOverdue')} ` : `${t('dueDate')} `}
                        {dueDate.toLocaleDateString(locale)}
                      </span>
                    )}
                    {!!commission.dispute_reason && (
                      <span className="text-warning">
                        {t('disputeReason')} {commission.dispute_reason as string}
                      </span>
                    )}
                    {!!commission.paid_at && (
                      <span className="text-success">
                        {t('paidOn')} {new Date(commission.paid_at as string).toLocaleDateString(locale)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <a href={`/api/pdf/invoice/${commission.id}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                        {t('downloadInvoice')}
                      </Button>
                    </a>
                    {(canPay || canDispute) && (
                      <CommissionActions
                        commissionId={commission.id as string}
                        canPay={canPay}
                        canDispute={canDispute}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
