import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth-guards';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Banknote, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { StatCard } from '@/components/features/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { formatSAR, getLocaleField } from '@/lib/utils';
import { CommissionsTableClient, type CommissionRow } from './commissions-table-client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function CommissionsPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; page?: string; search?: string; sort?: string }>;
}) {
  const { locale } = await routeParams;
  setRequestLocale(locale);
  const params = await searchParams;

  // Role guard — only contractor & supplier have commissions
  const { user, supabase } = await requireRole(['contractor', 'supplier']);

  const t = await getTranslations('dashboard.commissions');
  const tCommon = await getTranslations('dashboard.common');

  const page = Math.max(1, Number(params.page) || 1);
  const perPage = 20;
  const sort = params.sort || '';

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: 'created_at', ascending: false },
    oldest: { column: 'created_at', ascending: true },
    amountHigh: { column: 'total', ascending: false },
    amountLow: { column: 'total', ascending: true },
  };
  const sortConfig = sortMap[sort] ?? sortMap.newest;

  // Paginated query
  let query = db(supabase)
    .from('commissions')
    .select('*, deal:deal_id(title_ar, title_en)', { count: 'exact' })
    .eq('seller_id', user.id)
    .order(sortConfig.column, { ascending: sortConfig.ascending });

  if (params.status && ['pending', 'approved', 'paid', 'disputed', 'overdue'].includes(params.status)) {
    query = query.eq('status', params.status);
  }

  const { data: commissions, count } = await query.range((page - 1) * perPage, page * perPage - 1);
  const rawItems = (commissions ?? []) as Record<string, unknown>[];
  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / perPage);

  // Stats (unfiltered)
  const { data: allCommissions } = await db(supabase)
    .from('commissions')
    .select('status, total')
    .eq('seller_id', user.id);

  const allItems = (allCommissions ?? []) as { status: string; total: number }[];
  const totalPending = allItems
    .filter((c) => c.status === 'pending' || c.status === 'overdue')
    .reduce((sum, c) => sum + Number(c.total ?? 0), 0);
  const totalPaid = allItems
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.total ?? 0), 0);
  const overdueCount = allItems.filter((c) => c.status === 'overdue').length;
  const paidCount = allItems.filter((c) => c.status === 'paid').length;

  // Map rows
  const items: CommissionRow[] = rawItems.map((commission) => {
    const deal = commission.deal as Record<string, unknown> | null;
    const dealTitle = deal ? getLocaleField(deal, 'title', locale) : t('dealNumber', { id: (commission.deal_id as string).slice(0, 8) });
    const dueDate = commission.due_date ? new Date(commission.due_date as string) : null;
    const isOverdue = !!dueDate && dueDate < new Date() && commission.status === 'pending';
    const canPay = commission.status === 'pending' || commission.status === 'overdue';
    const canDispute =
      (commission.status === 'pending' || commission.status === 'overdue') &&
      new Date(commission.created_at as string).getTime() + 7 * 24 * 60 * 60 * 1000 > Date.now();

    return {
      id: commission.id as string,
      deal_id: commission.deal_id as string,
      deal_title: dealTitle,
      rate: commission.rate as number,
      deal_value: Number(commission.deal_value),
      amount: Number(commission.amount),
      vat_amount: Number(commission.vat_amount),
      total: Number(commission.total),
      status: commission.status as string,
      due_date: commission.due_date as string | null,
      paid_at: commission.paid_at as string | null,
      dispute_reason: commission.dispute_reason as string | null,
      created_at: commission.created_at as string,
      is_overdue: isOverdue,
      can_pay: canPay,
      can_dispute: canDispute,
    };
  });

  const filterGroups = [
    {
      key: 'status',
      label: tCommon('status'),
      options: [
        { value: 'pending', label: t('status.pending') },
        { value: 'approved', label: t('status.approved') },
        { value: 'paid', label: t('status.paid') },
        { value: 'disputed', label: t('status.disputed') },
        { value: 'overdue', label: t('status.overdue') },
      ],
    },
  ];

  const sortOptions = [
    { value: 'newest', label: tCommon('createdAt') + ' ↓' },
    { value: 'oldest', label: tCommon('createdAt') + ' ↑' },
    { value: 'amountHigh', label: t('amountHighSort') },
    { value: 'amountLow', label: t('amountLowSort') },
  ];

  const translations: Record<string, string> = {
    colDeal: t('colDeal'),
    colStatus: tCommon('status'),
    colDealValue: t('dealValue'),
    colTotal: t('total'),
    colDueDate: t('colDueDate'),
    commissionRate: t('colRate'),
    downloadInvoice: t('downloadInvoice'),
    noCommissions: t('noCommissions'),
    noCommissionsDesc: t('noCommissionsDesc'),
    viewDeals: t('viewDeals'),
    status_pending: t('status.pending'),
    status_approved: t('status.approved'),
    status_paid: t('status.paid'),
    status_disputed: t('status.disputed'),
    status_overdue: t('status.overdue'),
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={<Clock className="h-5 w-5 text-status-pending" />} label={t('pendingAmount')} value={formatSAR(totalPending, locale)} color="yellow" />
        <StatCard icon={<CheckCircle className="h-5 w-5 text-status-completed" />} label={t('paidAmount')} value={formatSAR(totalPaid, locale)} color="green" />
        <StatCard icon={<Banknote className="h-5 w-5 text-primary" />} label={t('paidCount')} value={paidCount} />
        <StatCard icon={<AlertTriangle className="h-5 w-5 text-destructive" />} label={t('overdueCount')} value={overdueCount} color="red" />
      </div>

      {/* Commission Table */}
      <CommissionsTableClient
        items={items}
        locale={locale}
        totalCount={totalCount}
        currentPage={page}
        totalPages={totalPages}
        filterGroups={filterGroups}
        sortOptions={sortOptions}
        translations={translations}
      />
    </div>
  );
}
