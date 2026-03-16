// =============================================================================
// Public RFQs Browse Page
// =============================================================================

import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { ShoppingCart, Search, Banknote, Calendar, MessageSquare } from 'lucide-react';
import { formatSAR, formatDate, getLocaleField } from '@/lib/utils';
import { getTranslations, getLocale } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function PublicRFQsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const t = await getTranslations('public.rfqs');
  const locale = await getLocale();

  let query = db(supabase)
    .from('rfqs')
    .select('id, title_ar, title_en, description_ar, description_en, quantity, budget_min, budget_max, deadline, response_count, created_at')
    .eq('status', 'published');

  if (params.q) {
    const pattern = `%${params.q}%`;
    query = query.or(`title_ar.ilike.${pattern},title_en.ilike.${pattern},description_ar.ilike.${pattern}`);
  }

  switch (params.sort) {
    case 'deadline':
      query = query.order('deadline', { ascending: true, nullsFirst: false });
      break;
    case 'budget':
      query = query.order('budget_max', { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data: rfqs } = await query.limit(50);

  const items = (rfqs ?? []) as Array<{
    id: string;
    title_ar: string;
    title_en: string;
    description_ar: string;
    description_en: string;
    quantity: number | null;
    budget_min: number | null;
    budget_max: number | null;
    deadline: string | null;
    response_count: number;
    created_at: string;
  }>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <form method="GET" className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={params.q}
              placeholder={t('search')}
              className="w-full rounded-lg border border-input bg-background py-2.5 pe-3 ps-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            name="sort"
            defaultValue={params.sort}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
          >
            <option value="recent">{t('sortRecent')}</option>
            <option value="deadline">{t('sortDeadline')}</option>
            <option value="budget">{t('sortBudget')}</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
          >
            {t('search')}
          </button>
        </form>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{t('resultCount', { count: items.length })}</p>

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-12 w-12" />}
          title={t('noRfqs')}
          description={t('noRfqsDesc')}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((rfq) => (
            <PublicRFQCard key={rfq.id} rfq={rfq} locale={locale} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public RFQ Card
// ---------------------------------------------------------------------------
function PublicRFQCard({
  rfq,
  locale,
  t,
}: {
  rfq: {
    id: string;
    title_ar: string;
    title_en: string;
    description_ar: string;
    description_en: string;
    quantity: number | null;
    budget_min: number | null;
    budget_max: number | null;
    deadline: string | null;
    response_count: number;
    created_at: string;
  };
  locale: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  const title = getLocaleField(rfq, 'title', locale);
  const descField = locale === 'ar' ? rfq.description_ar : (rfq.description_en || rfq.description_ar);
  const desc = descField?.slice(0, 100) + (descField?.length > 100 ? '…' : '');
  const isExpired = rfq.deadline && new Date(rfq.deadline) < new Date();

  return (
    <Link href={`/rfqs/${rfq.id}`}>
      <Card className="h-full p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-foreground line-clamp-2">{title}</h3>
            {isExpired && (
              <Badge variant="secondary" className="shrink-0">{t('expired')}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{desc}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {rfq.budget_max && (
              <span className="flex items-center gap-1">
                <Banknote className="h-3 w-3" />
                {t('upTo')} {formatSAR(rfq.budget_max)}
              </span>
            )}
            {rfq.quantity && (
              <span>{t('quantityLabel')} {rfq.quantity}</span>
            )}
            {rfq.deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(rfq.deadline)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {t('responseCount', { count: rfq.response_count })}
            </span>
            <span className="text-muted-foreground">
              {formatDate(rfq.created_at)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
