// =============================================================================
// Bids Page — Sent (contractor) + Received (project owner) with tab toggle
// =============================================================================

import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth-guards';
import { Gavel, Clock, Trophy } from 'lucide-react';
import { StatCard } from '@/components/features/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { getTranslations } from 'next-intl/server';
import { DirectionTabs } from '@/components/features/direction-tabs';
import { BidsTableClient } from './bids-table-client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

const STATUS_KEYS: Record<string, string> = {
  pending: 'statusPending',
  shortlisted: 'statusShortlisted',
  awarded: 'statusAwarded',
  rejected: 'statusRejected',
};

export interface BidItem {
  id: string;
  project_id: string;
  contractor_id?: string;
  amount: number;
  timeline_days: number;
  methodology_ar: string | null;
  methodology_en: string | null;
  status: string;
  submitted_at: string;
  updated_at: string;
  // Joined project fields
  project_title_ar: string | null;
  project_title_en: string | null;
  project_slug_ar: string | null;
  project_slug_en: string | null;
  project_status: string | null;
  // Joined contractor fields (for received view)
  contractor_company_ar: string | null;
  contractor_company_en: string | null;
  contractor_slug: string | null;
  // Joined deal fields (for awarded bids)
  deal_id?: string | null;
  deal_slug?: string | null;
}

export default async function MyBidsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string; page?: string; search?: string; sort?: string }>;
}) {
  const params = await searchParams;

  // Role guard — only project_owner & contractor can access bids
  const { user, profile, supabase } = await requireRole(['project_owner', 'contractor']);

  const t = await getTranslations('dashboard.myBids');
  const tCommon = await getTranslations('dashboard.common');

  const role = profile.role as string;

  // Determine default view based on role
  const activeView = params.view === 'sent' || params.view === 'received'
    ? params.view
    : role === 'contractor' ? 'sent' : 'received';

  const page = Math.max(1, Number(params.page) || 1);
  const perPage = 20;
  const search = params.search?.trim() || '';
  const sort = params.sort || '';

  // Sort mapping
  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: 'submitted_at', ascending: false },
    oldest: { column: 'submitted_at', ascending: true },
    amountHigh: { column: 'amount', ascending: false },
    amountLow: { column: 'amount', ascending: true },
  };
  const sortConfig = sortMap[sort] ?? sortMap.newest;

  // ---------------------------------------------------------------------------
  // Fetch SENT bids (as contractor)
  // ---------------------------------------------------------------------------
  let sentQuery = db(supabase)
    .from('bids')
    .select(`
      id, project_id, contractor_id, amount, timeline_days,
      methodology_ar, methodology_en, status,
      submitted_at, updated_at,
      projects (title_ar, title_en, slug_ar, slug_en, status),
      deals!deals_bid_id_fkey(id, title_slug)
    `, { count: 'exact' })
    .eq('contractor_id', user.id)
    .order(sortConfig.column, { ascending: sortConfig.ascending });

  if (params.status) {
    sentQuery = sentQuery.eq('status', params.status);
  }
  // Note: cross-table OR filters (projects.title_ar.ilike) are not supported in PostgREST
  // Search on sent bids is disabled until a denormalized or full-text approach is added

  const { data: rawSent, count: sentTotalRaw } = activeView === 'sent'
    ? await sentQuery.range((page - 1) * perPage, page * perPage - 1)
    : await sentQuery.limit(0);

  const sentTotal = sentTotalRaw ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sentItems: BidItem[] = ((rawSent ?? []) as any[]).map((b) => {
    const deal = Array.isArray(b.deals) ? b.deals[0] : b.deals;
    return {
      id: b.id,
      project_id: b.project_id,
      contractor_id: b.contractor_id,
      amount: Number(b.amount),
      timeline_days: b.timeline_days,
      methodology_ar: b.methodology_ar,
      methodology_en: b.methodology_en,
      status: b.status,
      submitted_at: b.submitted_at,
      updated_at: b.updated_at,
      project_title_ar: b.projects?.title_ar ?? null,
      project_title_en: b.projects?.title_en ?? null,
      project_slug_ar: b.projects?.slug_ar ?? null,
      project_slug_en: b.projects?.slug_en ?? null,
      project_status: b.projects?.status ?? null,
      contractor_company_ar: null,
      contractor_company_en: null,
      contractor_slug: null,
      deal_id: deal?.id ?? null,
      deal_slug: deal?.title_slug ?? null,
    };
  });

  // ---------------------------------------------------------------------------
  // Fetch RECEIVED bids (as project owner)
  // ---------------------------------------------------------------------------
  const { data: myProjects } = await db(supabase)
    .from('projects')
    .select('id')
    .eq('owner_id', user.id);

  const projectIds = (myProjects ?? []).map((p: { id: string }) => p.id);

  let receivedItems: BidItem[] = [];
  let receivedTotal = 0;
  if (projectIds.length > 0) {
    let recvQuery = db(supabase)
      .from('bids')
      .select(`
        id, project_id, contractor_id, amount, timeline_days,
        methodology_ar, methodology_en, status,
        submitted_at, updated_at,
        projects (title_ar, title_en, slug_ar, slug_en, status),
        profiles:contractor_id (company_name_ar, company_name_en, slug_ar, slug_en),
        deals!deals_bid_id_fkey(id, title_slug)
      `, { count: 'exact' })
      .in('project_id', projectIds)
      .order(sortConfig.column, { ascending: sortConfig.ascending });

    if (params.status) {
      recvQuery = recvQuery.eq('status', params.status);
    }
    // Note: cross-table OR filters are not supported in PostgREST — search omitted

    const { data: rawRecv, count: recvTotalRaw } = activeView === 'received'
      ? await recvQuery.range((page - 1) * perPage, page * perPage - 1)
      : await recvQuery.limit(0);

    receivedTotal = recvTotalRaw ?? 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    receivedItems = ((rawRecv ?? []) as any[]).map((b) => {
      const deal = Array.isArray(b.deals) ? b.deals[0] : b.deals;
      return {
        id: b.id,
        project_id: b.project_id,
        contractor_id: b.contractor_id,
        amount: Number(b.amount),
        timeline_days: b.timeline_days,
        methodology_ar: b.methodology_ar,
        methodology_en: b.methodology_en,
        status: b.status,
        submitted_at: b.submitted_at,
        updated_at: b.updated_at,
        project_title_ar: b.projects?.title_ar ?? null,
        project_title_en: b.projects?.title_en ?? null,
        project_slug_ar: b.projects?.slug_ar ?? null,
        project_slug_en: b.projects?.slug_en ?? null,
        project_status: b.projects?.status ?? null,
        contractor_company_ar: b.profiles?.company_name_ar ?? null,
        contractor_company_en: b.profiles?.company_name_en ?? null,
        contractor_slug: b.profiles?.slug_ar ?? b.profiles?.slug_en ?? null,
        deal_id: deal?.id ?? null,
        deal_slug: deal?.title_slug ?? null,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Active items + stats
  // ---------------------------------------------------------------------------
  const items = activeView === 'sent' ? sentItems : receivedItems;
  const totalCount = activeView === 'sent' ? sentTotal : receivedTotal;
  const totalPages = Math.ceil(totalCount / perPage);
  const pendingCount = items.filter(b => b.status === 'pending').length;
  const shortlistedCount = items.filter(b => b.status === 'shortlisted').length;
  const awardedCount = items.filter(b => b.status === 'awarded').length;

  const statusCounts: Record<string, number> = {};
  for (const key of Object.keys(STATUS_KEYS)) {
    statusCounts[key] = items.filter(b => b.status === key).length;
  }

  // Build filter groups and sort options for DashboardTableShell
  const filterGroups = [
    {
      key: 'status',
      label: t('status'),
      options: Object.entries(STATUS_KEYS)
        .map(([key, tKey]) => ({
          value: key,
          label: t(tKey as never),
        })),
    },
  ];

  const sortOptions = [
    { value: 'newest', label: tCommon('createdAt') + ' ↓' },
    { value: 'oldest', label: tCommon('createdAt') + ' ↑' },
    { value: 'amountHigh', label: t('amount') + ' ↓' },
    { value: 'amountLow', label: t('amount') + ' ↑' },
  ];

  const translations: Record<string, string> = {
    projectName: t('projectName'),
    contractorName: t('contractorName'),
    amount: t('amount'),
    timeline: t('timeline'),
    status: t('status'),
    submittedAt: t('submittedAt'),
    actions: t('actions'),
    editBid: t('editBid'),
    viewProject: t('viewProject'),
    noBids: activeView === 'sent' ? t('noBids') : t('noReceivedBids'),
    noBidsDesc: activeView === 'sent' ? t('noBidsDesc') : t('noReceivedBidsDesc'),
    browseProjects: t('browseProjects'),
    searchPlaceholder: t('projectName'),
    days: t('days', { count: '' }),
    viewDeal: t('viewDeal'),
    ...Object.fromEntries(Object.entries(STATUS_KEYS).map(([k, tKey]) => [
      `status_${k}`, t(tKey as never),
    ])),
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />

      {/* Direction Tabs */}
      <DirectionTabs
        tabs={[
          { key: 'sent', label: t('sentTab', { count: sentItems.length }).replace(` (${sentItems.length})`, ''), count: sentItems.length, href: '/dashboard/bids?view=sent' },
          { key: 'received', label: t('receivedTab', { count: receivedItems.length }).replace(` (${receivedItems.length})`, ''), count: receivedItems.length, href: '/dashboard/bids?view=received' },
        ]}
        activeTab={activeView}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<Gavel className="h-5 w-5 text-primary" />}
          label={activeView === 'sent' ? t('totalBids') : t('receivedBidsTotal')}
          value={totalCount}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-warning" />}
          label={t('pendingBids')}
          value={pendingCount}
          color="yellow"
        />
        <StatCard
          icon={<Gavel className="h-5 w-5 text-info" />}
          label={t('statusShortlisted')}
          value={shortlistedCount}
        />
        <StatCard
          icon={<Trophy className="h-5 w-5 text-success" />}
          label={t('awardedBids')}
          value={awardedCount}
          color="green"
        />
      </div>

      {/* Bids Table with Shell */}
      <BidsTableClient
        items={items}
        direction={activeView as 'sent' | 'received'}
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
