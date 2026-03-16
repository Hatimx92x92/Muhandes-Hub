// =============================================================================
// Dashboard — My Projects List
// =============================================================================

import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PostStatusBadge } from '@/components/features/post-status-badge';
import { EmptyState } from '@/components/features/empty-state';
import { Plus, MapPin, Calendar, Banknote, FolderKanban } from 'lucide-react';
import { formatSAR, formatDate, getLocaleField } from '@/lib/utils';
import { getTranslations, getLocale } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
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
    .select('id, title_ar, title_en, city, budget_min, budget_max, status, source, bid_count, created_at, timeline_start, timeline_end')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  const items = (projects ?? []) as Array<{
    id: string;
    title_ar: string;
    title_en: string;
    city: string;
    budget_min: number | null;
    budget_max: number | null;
    status: string;
    source: string;
    bid_count: number;
    created_at: string;
    timeline_start: string | null;
    timeline_end: string | null;
  }>;

  // Status counts
  const counts = {
    total: items.length,
    draft: items.filter((p) => p.status === 'draft').length,
    pending: items.filter((p) => p.status === 'pending').length,
    published: items.filter((p) => p.status === 'published').length,
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

      {/* Project List */}
      {items.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-12 w-12" />}
          title={t('noProjects')}
          description={t('noProjectsDesc')}
          actionLabel={t('createProject')}
          actionHref="/dashboard/projects/new"
        />
      ) : (
        <div className="space-y-3">
          {items.map((project) => (
            <ProjectCard key={project.id} project={project} locale={locale} tCommon={tCommon} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Project Card
// ---------------------------------------------------------------------------
function ProjectCard({
  project,
  locale,
  tCommon,
}: {
  project: {
    id: string;
    title_ar: string;
    title_en: string;
    city: string;
    budget_min: number | null;
    budget_max: number | null;
    status: string;
    source: string;
    bid_count: number;
    created_at: string;
    timeline_start: string | null;
    timeline_end: string | null;
  };
  locale: string;
  tCommon: (key: string) => string;
}) {
  const title = getLocaleField(project, 'title', locale);
  const validStatuses = ['draft', 'pending', 'published', 'rejected', 'awarded', 'completed', 'expired', 'closed'] as const;
  const status = validStatuses.includes(project.status as typeof validStatuses[number])
    ? (project.status as typeof validStatuses[number])
    : 'draft';

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <Card className="p-4 transition-colors hover:bg-card/80">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold text-foreground">
                {title}
              </h3>
              <PostStatusBadge status={status} />
              {project.source === 'subcontract' && (
                <span className="rounded-full bg-secondary/50 px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  {tCommon('subcontract')}
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {project.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {project.city}
                </span>
              )}
              {(project.budget_min || project.budget_max) && (
                <span className="flex items-center gap-1">
                  <Banknote className="h-3.5 w-3.5" />
                  {project.budget_min && project.budget_max
                    ? `${formatSAR(project.budget_min)} - ${formatSAR(project.budget_max)}`
                    : project.budget_max
                      ? `${tCommon('upTo')} ${formatSAR(project.budget_max)}`
                      : `${tCommon('from')} ${formatSAR(project.budget_min!)}`}
                </span>
              )}
              {project.timeline_start && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(project.timeline_start)}
                  {project.timeline_end && ` — ${formatDate(project.timeline_end)}`}
                </span>
              )}
            </div>
          </div>

          <div className="text-end">
            <div className="text-2xl font-bold text-foreground">{project.bid_count}</div>
            <div className="text-xs text-muted-foreground">{tCommon('bids')}</div>
          </div>
        </div>
      </Card>
    </Link>
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
