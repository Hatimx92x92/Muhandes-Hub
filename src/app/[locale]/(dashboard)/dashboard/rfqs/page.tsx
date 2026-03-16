// =============================================================================
// RFQ List Page — Dashboard
// =============================================================================

import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { ShoppingCart, Plus, Calendar, Banknote, MapPin, MessageSquare } from 'lucide-react';
import { formatSAR, formatDate, getLocaleField } from '@/lib/utils';
import { getTranslations, getLocale } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

const statusBadge: Record<string, BadgeProps['variant']> = {
  draft: 'draft',
  pending: 'pending',
  published: 'published',
  rejected: 'rejected',
  closed: 'secondary',
  expired: 'secondary',
};

export default async function RFQsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.rfqs');
  const tCommon = await getTranslations('dashboard.common');
  const locale = await getLocale();

  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role;
  const isSupplier = role === 'supplier';
  const tab = params.tab || (isSupplier ? 'browse' : 'my');

  // My RFQs (posters)
  let myRFQs: RFQItem[] = [];
  if (tab === 'my') {
    let query = db(supabase)
      .from('rfqs')
      .select('id, title_ar, title_en, description_ar, description_en, quantity, budget_min, budget_max, deadline, status, response_count, created_at')
      .eq('poster_id', user.id)
      .order('created_at', { ascending: false });

    if (params.status) {
      query = query.eq('status', params.status);
    }
    const { data } = await query.limit(100);
    myRFQs = (data ?? []) as RFQItem[];
  }

  // Browse published RFQs (for suppliers)
  let browseRFQs: RFQItem[] = [];
  if (tab === 'browse') {
    const { data } = await db(supabase)
      .from('rfqs')
      .select('id, title_ar, title_en, description_ar, description_en, quantity, budget_min, budget_max, deadline, status, response_count, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(50);
    browseRFQs = (data ?? []) as RFQItem[];
  }

  // My responses (for suppliers)
  let myResponses: ResponseItem[] = [];
  if (tab === 'responses' && isSupplier) {
    const { data } = await db(supabase)
      .from('rfq_responses')
      .select('id, rfq_id, pricing, status, created_at')
      .eq('supplier_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    myResponses = (data ?? []) as ResponseItem[];
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <Link
          href="/dashboard/rfqs/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          {t('new')}
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-border pb-2">
        {!isSupplier && (
          <Link
            href="/dashboard/rfqs?tab=my"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === 'my' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('myRfqs')}
          </Link>
        )}
        <Link
          href="/dashboard/rfqs?tab=browse"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === 'browse' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('browseRfqs')}
        </Link>
        {isSupplier && (
          <>
            <Link
              href="/dashboard/rfqs?tab=my"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === 'my' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('myRfqs')}
            </Link>
            <Link
              href="/dashboard/rfqs?tab=responses"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === 'responses' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('myResponses')}
            </Link>
          </>
        )}
      </div>

      {/* Status filters for "my" tab */}
      {tab === 'my' && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard/rfqs?tab=my"
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              !params.status ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tCommon('all')}
          </Link>
          {(['draft', 'pending', 'published', 'rejected', 'closed', 'expired'] as const).map((key) => (
            <Link
              key={key}
              href={`/dashboard/rfqs?tab=my&status=${key}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                params.status === key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tCommon(key)}
            </Link>
          ))}
        </div>
      )}

      {/* Content */}
      {tab === 'my' && (
        <RFQGrid items={myRFQs} emptyMessage={t('noRfqsCreated')} />
      )}
      {tab === 'browse' && (
        <RFQGrid items={browseRFQs} emptyMessage={t('noRfqsPublished')} />
      )}
      {tab === 'responses' && (
        <ResponseList items={myResponses} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RFQItem {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  quantity: number | null;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: string;
  response_count: number;
  created_at: string;
}

interface ResponseItem {
  id: string;
  rfq_id: string;
  pricing: Record<string, unknown>;
  status: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// RFQ Grid
// ---------------------------------------------------------------------------
async function RFQGrid({ items, emptyMessage }: { items: RFQItem[]; emptyMessage: string }) {
  const t = await getTranslations('dashboard.rfqs');
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart className="h-12 w-12" />}
        title={t('noRfqs')}
        description={emptyMessage}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((rfq) => (
        <RFQCard key={rfq.id} rfq={rfq} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RFQ Card
// ---------------------------------------------------------------------------
async function RFQCard({ rfq }: { rfq: RFQItem }) {
  const tCommon = await getTranslations('dashboard.common');
  const t = await getTranslations('dashboard.rfqs');
  const locale = await getLocale();
  const title = getLocaleField(rfq as unknown as Record<string, unknown>, 'title', locale);
  const desc = rfq.description_ar?.slice(0, 100) + (rfq.description_ar?.length > 100 ? '…' : '');

  return (
    <Link href={`/dashboard/rfqs/${rfq.id}`}>
      <Card className="h-full p-4 transition-colors hover:bg-card/80">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground line-clamp-2">{title}</h3>
            <Badge variant={statusBadge[rfq.status] || 'secondary'} className="shrink-0">
              {tCommon(rfq.status as 'draft' | 'pending' | 'published' | 'rejected' | 'closed' | 'expired')}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{desc}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {rfq.budget_max && (
              <span className="flex items-center gap-1">
                <Banknote className="h-3 w-3" />
                {tCommon('upTo')} {formatSAR(rfq.budget_max)}
              </span>
            )}
            {rfq.deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(rfq.deadline)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {rfq.response_count} {t('response')}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Response List (supplier's responses)
// ---------------------------------------------------------------------------
async function ResponseList({ items }: { items: ResponseItem[] }) {
  const t = await getTranslations('dashboard.rfqs');

  const responseStatusBadge: Record<string, BadgeProps['variant']> = {
    pending: 'pending',
    accepted: 'success',
    rejected: 'rejected',
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-12 w-12" />}
        title={t('noResponses')}
        description={t('noResponsesDesc')}
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((response) => (
        <Link key={response.id} href={`/dashboard/rfqs/${response.rfq_id}`}>
          <Card className="p-4 transition-colors hover:bg-card/80">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {t('responseToRfq')} #{response.rfq_id.slice(0, 8)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(response.created_at)}
                </p>
              </div>
              <Badge variant={responseStatusBadge[response.status] || 'secondary'}>
                {t(`response${response.status.charAt(0).toUpperCase() + response.status.slice(1)}` as 'responsePending' | 'responseAccepted' | 'responseRejected')}
              </Badge>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
