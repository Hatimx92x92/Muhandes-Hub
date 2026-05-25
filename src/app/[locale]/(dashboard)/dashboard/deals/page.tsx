// =============================================================================
// Deals List Page — Dashboard (with role + type filters, DataTable)
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/features/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { Handshake, TrendingUp, Banknote } from 'lucide-react';
import { formatSAR } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';
import { DealsTableClient } from './deals-table-client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

const STATUS_KEYS: Record<string, string> = {
  active: 'statusActive',
  in_progress: 'statusInProgress',
  completed: 'statusCompleted',
  cancelled: 'statusCancelled',
  disputed: 'statusDisputed',
};

const DEAL_TYPE_KEYS: Record<string, string> = {
  deal_project: 'dealTypeProject',
  deal_product: 'dealTypeProduct',
};

const TRIGGER_KEYS: Record<string, string> = {
  bid_award: 'triggerBidAward',
  inquiry_quotation: 'triggerInquiryQuotation',
  rfq_response: 'triggerRfqResponse',
  direct_hire: 'triggerDirectHire',
};

export interface DealItem {
  id: string;
  title_slug: string;
  deal_type: string;
  trigger_source: string;
  seller_id: string;
  buyer_id: string;
  value: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  seller_progress: number;
  buyer_progress: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; role?: string; type?: string; page?: string; search?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.deals');
  const tCommon = await getTranslations('dashboard.common');

  const page = Math.max(1, Number(params.page) || 1);
  const perPage = 20;
  const search = params.search?.trim() || '';
  const sort = params.sort || '';

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: 'created_at', ascending: false },
    oldest: { column: 'created_at', ascending: true },
    valueHigh: { column: 'value', ascending: false },
    valueLow: { column: 'value', ascending: true },
  };
  const sortConfig = sortMap[sort] ?? sortMap.newest;

  // Fetch deals where user is buyer or seller
  let query = db(supabase)
    .from('deals')
    .select('id, title_slug, deal_type, trigger_source, seller_id, buyer_id, value, commission_rate, commission_amount, status, seller_progress, buyer_progress, started_at, completed_at, created_at', { count: 'exact' })
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order(sortConfig.column, { ascending: sortConfig.ascending });

  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.type) {
    query = query.eq('deal_type', params.type);
  }
  if (params.role === 'buyer') {
    query = query.eq('buyer_id', user.id);
  } else if (params.role === 'seller') {
    query = query.eq('seller_id', user.id);
  }
  if (search) {
    query = query.ilike('title_slug', `%${search}%`);
  }

  const { data: deals, count: totalCountRaw } = await query.range((page - 1) * perPage, page * perPage - 1);
  const items = (deals ?? []) as DealItem[];
  const totalCount = totalCountRaw ?? 0;
  const totalPages = Math.ceil(totalCount / perPage);

  // Stats — quick counts from unfiltered query
  const { count: activeCountRaw } = await db(supabase)
    .from('deals').select('id', { count: 'exact' })
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .in('status', ['active', 'in_progress']);
  const { count: completedCountRaw } = await db(supabase)
    .from('deals').select('id', { count: 'exact' })
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .eq('status', 'completed');
  const { data: valueData } = await db(supabase)
    .from('deals').select('value')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
  const activeCount = activeCountRaw ?? 0;
  const completedCount = completedCountRaw ?? 0;
  const totalValue = (valueData ?? []).reduce((sum: number, d: { value: number }) => sum + (Number(d.value) || 0), 0);

  // Build filter groups for DashboardTableShell
  const filterGroups = [
    {
      key: 'status',
      label: tCommon('status'),
      options: Object.entries(STATUS_KEYS).map(([key, tKey]) => ({
        value: key,
        label: t(tKey as never),
      })),
    },
    {
      key: 'role',
      label: t('asBuyer').replace(/\s*\(.*\)/, ''),
      options: [
        { value: 'buyer', label: t('asBuyer') },
        { value: 'seller', label: t('asSeller') },
      ],
    },
    {
      key: 'type',
      label: tCommon('category'),
      options: Object.entries(DEAL_TYPE_KEYS).map(([key, tKey]) => ({
        value: key,
        label: t(tKey as never),
      })),
    },
  ];

  const sortOptions = [
    { value: 'newest', label: tCommon('createdAt') + ' ↓' },
    { value: 'oldest', label: tCommon('createdAt') + ' ↑' },
    { value: 'valueHigh', label: t('totalValue') + ' ↓' },
    { value: 'valueLow', label: t('totalValue') + ' ↑' },
  ];

  const translations: Record<string, string> = {
    deal: t('dealPrefix'),
    status: tCommon('status'),
    value: t('totalValue'),
    role: t('asBuyer').replace(/\s*\(.*\)/, ''),
    progress: t('sellerProgress'),
    created: tCommon('createdAt'),
    asBuyer: t('asBuyer'),
    asSeller: t('asSeller'),
    youAreBuyer: t('youAreBuyer'),
    youAreSeller: t('youAreSeller'),
    youAreProjectOwner: t('youAreProjectOwner' as never),
    youAreContractor: t('youAreContractor' as never),
    youAreSupplier: t('youAreSupplier' as never),
    youAreBuyerRole: t('youAreBuyerRole' as never),
    commission: t('commission'),
    buyerProgress: t('buyerProgress'),
    sellerProgress: t('sellerProgress'),
    noDeals: t('noDeals'),
    noDealsDesc: t('noDealsDesc'),
    ...Object.fromEntries(Object.entries(STATUS_KEYS).map(([k, tKey]) => [
      `status_${k}`, t(tKey as never),
    ])),
    ...Object.fromEntries(Object.entries(DEAL_TYPE_KEYS).map(([k, tKey]) => [
      `type_${k}`, t(tKey as never),
    ])),
    ...Object.fromEntries(Object.entries(TRIGGER_KEYS).map(([k, tKey]) => [
      `trigger_${k}`, t(tKey as never),
    ])),
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          label={t('activeDeals')}
          value={activeCount}
        />
        <StatCard
          icon={<Handshake className="h-5 w-5 text-success" />}
          label={tCommon('completed')}
          value={completedCount}
          color="green"
        />
        <StatCard
          icon={<Banknote className="h-5 w-5 text-warning" />}
          label={t('totalValue')}
          value={formatSAR(totalValue)}
          color="yellow"
        />
      </div>

      {/* Deals Table with Shell */}
      <DealsTableClient
        items={items}
        userId={user.id}
        totalCount={totalCount}
        currentPage={page}
        totalPages={totalPages}
        translations={translations}
        filterGroups={filterGroups}
        sortOptions={sortOptions}
      />
    </div>
  );
}
