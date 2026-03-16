// =============================================================================
// Deals List Page — Dashboard
// =============================================================================

import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { Handshake, User, Calendar, Banknote, TrendingUp } from 'lucide-react';
import { formatSAR, formatDate } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

const statusBadge: Record<string, BadgeProps['variant']> = {
  active: 'info',
  in_progress: 'pending',
  completed: 'success',
  cancelled: 'rejected',
  disputed: 'destructive',
};

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

interface DealItem {
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
  searchParams: Promise<{ status?: string; role?: string }>;
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

  const { data: deals } = await query.limit(100);
  const items = (deals ?? []) as DealItem[];

  // Split by role in deal
  const asBuyer = params.role === 'seller' ? [] : items.filter(d => d.buyer_id === user.id);
  const asSeller = params.role === 'buyer' ? [] : items.filter(d => d.seller_id === user.id);

  // Stats
  const activeCount = items.filter(d => d.status === 'active' || d.status === 'in_progress').length;
  const completedCount = items.filter(d => d.status === 'completed').length;
  const totalValue = items.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

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
      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/deals">
          <Badge variant={!params.status ? 'default' : 'secondary'}>{tCommon('all')} ({items.length})</Badge>
        </Link>
        {Object.entries(STATUS_KEYS).map(([key, tKey]) => {
          const count = items.filter(d => d.status === key).length;
          if (count === 0) return null;
          return (
            <Link key={key} href={`/dashboard/deals?status=${key}`}>
              <Badge variant={params.status === key ? 'default' : 'secondary'}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {t(tKey as any)} ({count})
              </Badge>
            </Link>
          );
        })}
      </div>

      {/* Deals as buyer */}
      {(params.role !== 'seller') && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">{t('asBuyer')} ({asBuyer.length})</h2>
          {asBuyer.length === 0 ? (
            <EmptyState
              icon={<Handshake className="h-12 w-12" />}
              title={t('noDealsAsBuyer')}
              description={t('noDealsAsBuyerDesc')}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {asBuyer.map(deal => (
                <DealCard key={deal.id} deal={deal} userRole="buyer" />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Deals as seller */}
      {(params.role !== 'buyer') && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">{t('asSeller')} ({asSeller.length})</h2>
          {asSeller.length === 0 ? (
            <EmptyState
              icon={<Handshake className="h-12 w-12" />}
              title={t('noDealsAsSeller')}
              description={t('noDealsAsSellerDesc')}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {asSeller.map(deal => (
                <DealCard key={deal.id} deal={deal} userRole="seller" />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Deal Card Component
// ---------------------------------------------------------------------------
async function DealCard({ deal, userRole }: { deal: DealItem; userRole: 'buyer' | 'seller' }) {
  const t = await getTranslations('dashboard.deals');

  return (
    <Link href={`/dashboard/deals/${deal.id}`}>
      <Card className="p-4 transition-shadow hover:shadow-md">
        <div className="mb-3 flex items-center justify-between">
          <Badge variant={statusBadge[deal.status] ?? 'secondary'}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {t((STATUS_KEYS[deal.status] ?? deal.status) as any)}
          </Badge>
          <Badge variant="outline">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {t((DEAL_TYPE_KEYS[deal.deal_type] ?? deal.deal_type) as any)}
          </Badge>
        </div>

        <h3 className="mb-1 text-sm font-semibold text-foreground line-clamp-1">
          {deal.title_slug || `${t('dealPrefix')} #${deal.id.slice(0, 8)}`}
        </h3>

        <p className="mb-3 text-xs text-muted-foreground">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {t((TRIGGER_KEYS[deal.trigger_source] ?? deal.trigger_source) as any)}
        </p>

        {/* Progress Bars */}
        <div className="mb-3 space-y-2">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('sellerProgress')}</span>
              <span className="font-medium">{deal.seller_progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${deal.seller_progress}%` }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('buyerProgress')}</span>
              <span className="font-medium">{deal.buyer_progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: `${deal.buyer_progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Banknote className="h-3.5 w-3.5" />
            {formatSAR(Number(deal.value) || 0)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(deal.created_at)}
          </span>
        </div>

        {/* Role indicator */}
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          <span>{userRole === 'buyer' ? t('youAreBuyer') : t('youAreSeller')}</span>
          {deal.commission_rate > 0 && (
            <span className="ms-auto text-warning">
              {t('commission')} {(deal.commission_rate * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
