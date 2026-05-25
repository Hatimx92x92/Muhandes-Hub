// =============================================================================
// RFQ List Page — Dashboard
// =============================================================================

import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { buttonVariants } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { ShoppingCart, Plus } from 'lucide-react';
import { formatSAR, getLocaleField, getEntitySlug } from '@/lib/utils';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DirectionTabs } from '@/components/features/direction-tabs';
import { RFQsTableClient, ResponsesTableClient, type RFQRow, type ResponseRow } from './rfqs-table-client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function RFQsPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; tab?: string; page?: string; search?: string; sort?: string }>;
}) {
  const { locale } = await routeParams;
  setRequestLocale(locale);
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.rfqs');
  const tCommon = await getTranslations('dashboard.common');

  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role;
  const isSupplier = role === 'supplier';
  const tab = params.tab || (isSupplier ? 'browse' : 'my');

  const page = Math.max(1, Number(params.page) || 1);
  const perPage = 20;
  const search = params.search?.trim() || '';
  const sort = params.sort || '';

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: 'created_at', ascending: false },
    oldest: { column: 'created_at', ascending: true },
    budgetHigh: { column: 'budget_max', ascending: false },
    budgetLow: { column: 'budget_max', ascending: true },
    deadlineSoon: { column: 'deadline', ascending: true },
    deadlineLate: { column: 'deadline', ascending: false },
  };
  const sortConfig = sortMap[sort] ?? sortMap.newest;

  // ── Tab counts ──────────────────────────────────────────────────────────
  const { count: myTabCount } = await db(supabase)
    .from('rfqs').select('id', { count: 'exact' })
    .eq('poster_id', user.id);

  const { count: browseTabCount } = await db(supabase)
    .from('rfqs').select('id', { count: 'exact' })
    .eq('status', 'published');

  let responsesTabCount = 0;
  if (isSupplier) {
    const { count: rc } = await db(supabase)
      .from('rfq_responses').select('id', { count: 'exact' })
      .eq('supplier_id', user.id);
    responsesTabCount = rc ?? 0;
  }

  // ── Data fetching ───────────────────────────────────────────────────────
  let items: RFQRow[] = [];
  let responseItems: ResponseRow[] = [];
  let totalCount = 0;

  if (tab === 'my' || tab === 'browse') {
    let query = db(supabase)
      .from('rfqs')
      .select('id, title_ar, title_en, budget_min, budget_max, deadline, status, response_count, created_at, slug_ar, slug_en', { count: 'exact' })
      .order(sortConfig.column, { ascending: sortConfig.ascending });

    if (tab === 'my') {
      query = query.eq('poster_id', user.id);
      if (params.status) query = query.eq('status', params.status);
    } else {
      query = query.eq('status', 'published');
    }

    if (search) {
      const term = `%${search}%`;
      query = query.or(`title_ar.ilike.${term},title_en.ilike.${term}`);
    }

    const { data, count } = await query.range((page - 1) * perPage, page * perPage - 1);
    totalCount = count ?? 0;

    items = ((data ?? []) as Array<Record<string, unknown>>).map((rfq) => ({
      id: rfq.id as string,
      title: getLocaleField(rfq, 'title', locale),
      status: rfq.status as string,
      budget_min: rfq.budget_min as number | null,
      budget_max: rfq.budget_max as number | null,
      deadline: rfq.deadline as string | null,
      response_count: (rfq.response_count ?? 0) as number,
      created_at: rfq.created_at as string,
      slug: getEntitySlug(rfq as { slug_ar?: string | null; slug_en?: string | null }, locale),
    }));
  } else if (tab === 'responses' && isSupplier) {
    const { data, count } = await db(supabase)
      .from('rfq_responses')
      .select('id, rfq_id, status, created_at', { count: 'exact' })
      .eq('supplier_id', user.id)
      .order(sortConfig.column, { ascending: sortConfig.ascending })
      .range((page - 1) * perPage, page * perPage - 1);

    totalCount = count ?? 0;
    responseItems = ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
      id: r.id as string,
      rfq_id: r.rfq_id as string,
      status: r.status as string,
      created_at: r.created_at as string,
    }));
  }

  const totalPages = Math.ceil(totalCount / perPage);

  // ── Filter & Sort options ──────────────────────────────────────────────
  const rfqFilterGroups = tab === 'my'
    ? [
        {
          key: 'status',
          label: tCommon('status'),
          options: [
            { value: 'draft', label: tCommon('draft') },
            { value: 'pending', label: tCommon('pending') },
            { value: 'published', label: tCommon('published') },
            { value: 'rejected', label: tCommon('rejected') },
            { value: 'closed', label: tCommon('closed') },
            { value: 'expired', label: tCommon('expired') },
          ],
        },
      ]
    : [];

  const rfqSortOptions = [
    { value: 'newest', label: tCommon('createdAt') + ' ↓' },
    { value: 'oldest', label: tCommon('createdAt') + ' ↑' },
    { value: 'budgetHigh', label: t('budgetHighSort') },
    { value: 'budgetLow', label: t('budgetLowSort') },
    { value: 'deadlineSoon', label: t('deadlineSoonSort') },
    { value: 'deadlineLate', label: t('deadlineLateSort') },
  ];

  const responseSortOptions = [
    { value: 'newest', label: tCommon('createdAt') + ' ↓' },
    { value: 'oldest', label: tCommon('createdAt') + ' ↑' },
  ];

  // Translations for client
  const translations: Record<string, string> = {
    colTitle: t('colTitle'),
    colStatus: tCommon('status'),
    colBudget: t('colBudget'),
    colDeadline: t('colDeadline'),
    colResponses: t('colResponses'),
    colCreated: tCommon('createdAt'),
    colRfq: t('colRfq'),
    upTo: tCommon('upTo'),
    noRfqs: t('noRfqs'),
    noRfqsDesc: tab === 'my' ? t('noRfqsCreated') : t('noRfqsPublished'),
    noResponses: t('noResponses'),
    noResponsesDesc: t('noResponsesDesc'),
    responseToRfq: t('responseToRfq'),
    status_draft: tCommon('draft'),
    status_pending: tCommon('pending'),
    status_published: tCommon('published'),
    status_rejected: tCommon('rejected'),
    status_closed: tCommon('closed'),
    status_expired: tCommon('expired'),
    responseStatus_pending: t('responsePending'),
    responseStatus_accepted: t('responseAccepted'),
    responseStatus_rejected: t('responseRejected'),
  };

  // ── Tab config ─────────────────────────────────────────────────────────
  const tabs = [];
  if (!isSupplier) {
    tabs.push({ key: 'my', label: t('myRfqs'), count: myTabCount ?? 0, href: '/dashboard/rfqs?tab=my' });
  }
  tabs.push({ key: 'browse', label: t('browseRfqs'), count: browseTabCount ?? 0, href: '/dashboard/rfqs?tab=browse' });
  if (isSupplier) {
    tabs.push({ key: 'my', label: t('myRfqs'), count: myTabCount ?? 0, href: '/dashboard/rfqs?tab=my' });
    tabs.push({ key: 'responses', label: t('myResponses'), count: responsesTabCount, href: '/dashboard/rfqs?tab=responses' });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        action={
          <Link href="/dashboard/rfqs/new" className={buttonVariants()}>
            <Plus className="h-4 w-4" />
            {t('new')}
          </Link>
        }
      />

      {/* Tabs */}
      <DirectionTabs tabs={tabs} activeTab={tab} />

      {/* Content */}
      {(tab === 'my' || tab === 'browse') && (
        <RFQsTableClient
          items={items}
          totalCount={totalCount}
          currentPage={page}
          totalPages={totalPages}
          filterGroups={rfqFilterGroups}
          sortOptions={rfqSortOptions}
          translations={translations}
        />
      )}
      {tab === 'responses' && (
        <ResponsesTableClient
          items={responseItems}
          totalCount={totalCount}
          currentPage={page}
          totalPages={totalPages}
          sortOptions={responseSortOptions}
          translations={translations}
        />
      )}
    </div>
  );
}
