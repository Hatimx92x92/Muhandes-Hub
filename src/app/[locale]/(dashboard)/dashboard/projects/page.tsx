// =============================================================================
// Dashboard — My Projects List
// =============================================================================

import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/features/empty-state';
import { Plus, FolderKanban } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';
import { ProjectsTableClient } from './projects-table-client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export interface ProjectRow {
  id: string;
  title_ar: string;
  title_en: string;
  city_id: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: string;
  source: string;
  bid_count: number;
  created_at: string;
  timeline_start: string | null;
  timeline_end: string | null;
  slug_ar?: string | null;
  slug_en?: string | null;
}

export default async function ProjectsListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.projects');
  const tCommon = await getTranslations('dashboard.common');
  const locale = await getLocale();

  // Fetch user projects
  const { data: projects } = await db(supabase)
    .from('projects')
    .select('id, title_ar, title_en, city_id, budget_min, budget_max, status, source, bid_count, created_at, timeline_start, timeline_end, slug_ar, slug_en')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  const items = (projects ?? []) as ProjectRow[];

  // Status counts
  const counts = {
    total: items.length,
    draft: items.filter((p) => p.status === 'draft').length,
    pending: items.filter((p) => p.status === 'pending').length,
    published: items.filter((p) => p.status === 'published').length,
  };

  // Serializable translations for client
  const translations = {
    title: t('title'),
    name: tCommon('titleEn'),
    status: tCommon('status'),
    city: tCommon('city'),
    budget: tCommon('budget'),
    bids: tCommon('bids'),
    created: tCommon('createdAt'),
    subcontract: tCommon('subcontract'),
    upTo: tCommon('upTo'),
    from: tCommon('from'),
    noProjects: t('noProjects'),
    noProjectsDesc: t('noProjectsDesc'),
    createProject: t('createProject'),
    delete: tCommon('delete'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button>
            <Plus className="me-2 h-4 w-4" />
            {t('new')}
          </Button>
        </Link>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label={tCommon('all')} count={counts.total} />
        <SummaryCard label={tCommon('draft')} count={counts.draft} variant="gray" />
        <SummaryCard label={tCommon('pending')} count={counts.pending} variant="yellow" />
        <SummaryCard label={tCommon('published')} count={counts.published} variant="green" />
      </div>

      {/* Projects Table */}
      <ProjectsTableClient items={items} locale={locale} translations={translations} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary Card
// ---------------------------------------------------------------------------
function SummaryCard({
  label,
  count,
  variant = 'default',
}: {
  label: string;
  count: number;
  variant?: 'default' | 'gray' | 'yellow' | 'green';
}) {
  const colors = {
    default: 'border-border',
    gray: 'border-border',
    yellow: 'border-status-pending/30',
    green: 'border-status-completed/30',
  };

  return (
    <Card className={`border ${colors[variant]} p-3 text-center`}>
      <div className="text-2xl font-bold text-foreground">{count}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}
