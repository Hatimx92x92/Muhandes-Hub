// =============================================================================
// Deals List Page — Dashboard (with role + type filters, DataTable)
// =============================================================================

import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { Handshake, TrendingUp, Calendar, Banknote } from 'lucide-react';
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
  searchParams: Promise<{ status?: string; role?: string; type?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.deals');
  const tCommon = await getTranslations('dashboard.common');

  // Fetch deals where user is buyer or seller
  let query = db(supabase)
    .from('deals')
    .select('id, title_slug, deal_type, trigger_source, seller_id, buyer_id, value, commission_rate, commission_amount, status, seller_progress, buyer_progress, started_at, completed_at, created_at')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.type) {
    query = query.eq('deal_type', params.type);
  }

  const { data: deals } = await query.limit(100);
  let items = (deals ?? []) as DealItem[];

  // Client-side role filter (buyer/seller in the deal, not the user's global role)
  if (params.role === 'buyer') {
    items = items.filter(d => d.buyer_id === user.id);
  } else if (params.role === 'seller') {
    items = items.filter(d => d.seller_id === user.id);
  }

  // Stats (from all fetched items before role filter for accurate counts)
  const allItems = (deals ?? []) as DealItem[];
  const activeCount = allItems.filter(d => d.status === 'active' || d.status === 'in_progress').length;
  const completedCount = allItems.filter(d => d.status === 'completed').length;
  const totalValue = allItems.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  // Count by status (for filter badges)
  const statusCounts: Record<string, number> = {};
  for (const key of Object.keys(STATUS_KEYS)) {
    statusCounts[key] = allItems.filter(d => d.status === key).length;
  }

  // Count by role
  const buyerCount = allItems.filter(d => d.buyer_id === user.id).length;
  const sellerCount = allItems.filter(d => d.seller_id === user.id).length;

  // Count by type
  const projectDealCount = allItems.filter(d => d.deal_type === 'deal_project').length;
  const productDealCount = allItems.filter(d => d.deal_type === 'deal_product').length;

  // Build filter query string helper
  const buildFilterHref = (overrides: Record<string, string | undefined>) => {
    const base: Record<string, string> = {};
    if (params.status) base.status = params.status;
    if (params.role) base.role = params.role;
    if (params.type) base.type = params.type;
    const merged = { ...base, ...overrides };
    // Remove undefined/empty values
    const cleaned = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== undefined && v !== ''),
    );
    const qs = new URLSearchParams(cleaned as Record<string, string>).toString();
    return `/dashboard/deals${qs ? `?${qs}` : ''}`;
  };

  // Serializable translations for client component
  const translations: Record<string, string> = {
    deal: t('dealPrefix'),
    status: tCommon('status'),
    type: t('dealTypeProject' as never) ? 'type' : 'type',
    value: t('totalValue'),
    role: t('asBuyer').replace(/\s*\(.*\)/, ''),
    progress: t('sellerProgress'),
    created: tCommon('createdAt'),
    asBuyer: t('asBuyer'),
    asSeller: t('asSeller'),
    youAreBuyer: t('youAreBuyer'),
    youAreSeller: t('youAreSeller'),
    commission: t('commission'),
    buyerProgress: t('buyerProgress'),
    sellerProgress: t('sellerProgress'),
    noDeals: t('noDeals'),
    noDealsDesc: t('noDealsDesc'),
    // Status labels
    ...Object.fromEntries(Object.entries(STATUS_KEYS).map(([k, tKey]) => [
      `status_${k}`, t(tKey as never),
    ])),
    // Type labels
    ...Object.fromEntries(Object.entries(DEAL_TYPE_KEYS).map(([k, tKey]) => [
      `type_${k}`, t(tKey as never),
    ])),
    // Trigger labels
    ...Object.fromEntries(Object.entries(TRIGGER_KEYS).map(([k, tKey]) => [
      `trigger_${k}`, t(tKey as never),
    ])),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('activeDeals')}</p>
              <p className="text-xl font-bold">{activeCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Handshake className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{tCommon('completed')}</p>
              <p className="text-xl font-bold">{completedCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Banknote className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('totalValue')}</p>
              <p className="text-xl font-bold">{formatSAR(totalValue)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Status Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Link href={buildFilterHref({ status: undefined })}>
            <Badge variant={!params.status ? 'default' : 'secondary'}>{tCommon('all')} ({allItems.length})</Badge>
          </Link>
          {Object.entries(STATUS_KEYS).map(([key, tKey]) => {
            const count = statusCounts[key] || 0;
            if (count === 0) return null;
            return (
              <Link key={key} href={buildFilterHref({ status: key })}>
                <Badge variant={params.status === key ? 'default' : 'secondary'}>
                  {t(tKey as never)} ({count})
                </Badge>
              </Link>
            );
          })}
        </div>

        {/* Role Filters */}
        <div className="flex flex-wrap gap-2">
          <Link href={buildFilterHref({ role: undefined })}>
            <Badge variant={!params.role ? 'info' : 'outline'}>
              {tCommon('all')} ({allItems.length})
            </Badge>
          </Link>
          {buyerCount > 0 && (
            <Link href={buildFilterHref({ role: 'buyer' })}>
              <Badge variant={params.role === 'buyer' ? 'info' : 'outline'}>
                {t('asBuyer')} ({buyerCount})
              </Badge>
            </Link>
          )}
          {sellerCount > 0 && (
            <Link href={buildFilterHref({ role: 'seller' })}>
              <Badge variant={params.role === 'seller' ? 'info' : 'outline'}>
                {t('asSeller')} ({sellerCount})
              </Badge>
            </Link>
          )}
        </div>

        {/* Deal Type Filters */}
        <div className="flex flex-wrap gap-2">
          <Link href={buildFilterHref({ type: undefined })}>
            <Badge variant={!params.type ? 'pending' : 'outline'}>
              {tCommon('all')} ({allItems.length})
            </Badge>
          </Link>
          {projectDealCount > 0 && (
            <Link href={buildFilterHref({ type: 'deal_project' })}>
              <Badge variant={params.type === 'deal_project' ? 'pending' : 'outline'}>
                {t('dealTypeProject' as never)} ({projectDealCount})
              </Badge>
            </Link>
          )}
          {productDealCount > 0 && (
            <Link href={buildFilterHref({ type: 'deal_product' })}>
              <Badge variant={params.type === 'deal_product' ? 'pending' : 'outline'}>
                {t('dealTypeProduct' as never)} ({productDealCount})
              </Badge>
            </Link>
          )}
        </div>
      </div>

      {/* Deals Table */}
      <DealsTableClient
        items={items}
        userId={user.id}
        translations={translations}
      />
    </div>
  );
}
