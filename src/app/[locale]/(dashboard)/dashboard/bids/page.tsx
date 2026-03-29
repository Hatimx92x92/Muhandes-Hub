// =============================================================================
// My Bids Page — Contractor bid tracking (with status filters, DataTable)
// =============================================================================

import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { Gavel, Clock, Trophy, XCircle } from 'lucide-react';
import { formatSAR } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';
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
  project_slug: string | null;
  project_status: string | null;
}

export default async function MyBidsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.myBids');
  const tCommon = await getTranslations('dashboard.common');

  // Role check — contractor only
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'contractor') {
    redirect('/dashboard');
  }

  // Fetch bids with project info
  let query = db(supabase)
    .from('bids')
    .select(`
      id, project_id, amount, timeline_days,
      methodology_ar, methodology_en, status,
      submitted_at, updated_at,
      projects!inner (
        title_ar, title_en, slug, status
      )
    `)
    .eq('contractor_id', user.id)
    .order('submitted_at', { ascending: false });

  if (params.status) {
    query = query.eq('status', params.status);
  }

  const { data: rawBids } = await query.limit(200);

  // Flatten the joined data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allItems: BidItem[] = ((rawBids ?? []) as any[]).map((b) => ({
    id: b.id,
    project_id: b.project_id,
    amount: Number(b.amount),
    timeline_days: b.timeline_days,
    methodology_ar: b.methodology_ar,
    methodology_en: b.methodology_en,
    status: b.status,
    submitted_at: b.submitted_at,
    updated_at: b.updated_at,
    project_title_ar: b.projects?.title_ar ?? null,
    project_title_en: b.projects?.title_en ?? null,
    project_slug: b.projects?.slug ?? null,
    project_status: b.projects?.status ?? null,
  }));

  // Stats (from unfiltered set for accurate counts)
  const totalCount = allItems.length;
  const pendingCount = allItems.filter(b => b.status === 'pending').length;
  const shortlistedCount = allItems.filter(b => b.status === 'shortlisted').length;
  const awardedCount = allItems.filter(b => b.status === 'awarded').length;

  // Count by status (for filter badges)
  const statusCounts: Record<string, number> = {};
  for (const key of Object.keys(STATUS_KEYS)) {
    statusCounts[key] = allItems.filter(b => b.status === key).length;
  }

  // Build filter query string helper
  const buildFilterHref = (overrides: Record<string, string | undefined>) => {
    const base: Record<string, string> = {};
    if (params.status) base.status = params.status;
    const merged = { ...base, ...overrides };
    const cleaned = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== undefined && v !== ''),
    );
    const qs = new URLSearchParams(cleaned as Record<string, string>).toString();
    return `/dashboard/bids${qs ? `?${qs}` : ''}`;
  };

  // Serializable translations for client component
  const translations: Record<string, string> = {
    projectName: t('projectName'),
    amount: t('amount'),
    timeline: t('timeline'),
    status: t('status'),
    submittedAt: t('submittedAt'),
    actions: t('actions'),
    editBid: t('editBid'),
    viewProject: t('viewProject'),
    noBids: t('noBids'),
    noBidsDesc: t('noBidsDesc'),
    browseProjects: t('browseProjects'),
    days: t('days', { count: '' }),
    // Status labels
    ...Object.fromEntries(Object.entries(STATUS_KEYS).map(([k, tKey]) => [
      `status_${k}`, t(tKey as never),
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Gavel className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('totalBids')}</p>
              <p className="text-xl font-bold">{totalCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('pendingBids')}</p>
              <p className="text-xl font-bold">{pendingCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <Gavel className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('statusShortlisted')}</p>
              <p className="text-xl font-bold">{shortlistedCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Trophy className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('awardedBids')}</p>
              <p className="text-xl font-bold">{awardedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        <Link href={buildFilterHref({ status: undefined })}>
          <Badge variant={!params.status ? 'default' : 'secondary'}>
            {tCommon('all')} ({totalCount})
          </Badge>
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

      {/* Bids Table */}
      <BidsTableClient
        items={allItems}
        translations={translations}
      />
    </div>
  );
}
