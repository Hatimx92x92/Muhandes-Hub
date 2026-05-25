// =============================================================================
// Dashboard — My Projects List
// =============================================================================

import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth-guards';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/features/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, FolderKanban, FileText, Clock } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
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
  city_name_ar: string | null;
  city_name_en: string | null;
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
  thumbnail_url?: string | null;
}

export default async function ProjectsListPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; page?: string; search?: string; sort?: string }>;
}) {
  const { locale } = await routeParams;
  setRequestLocale(locale);
  const params = await searchParams;

  // Role guard — only project_owner & contractor can access projects
  await requireRole(['project_owner', 'contractor']);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.projects');
  const tCommon = await getTranslations('dashboard.common');

  const page = Math.max(1, Number(params.page) || 1);
  const perPage = 20;
  const search = params.search?.trim() || '';
  const sort = params.sort || '';

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: 'created_at', ascending: false },
    oldest: { column: 'created_at', ascending: true },
    budgetHigh: { column: 'budget_max', ascending: false },
    budgetLow: { column: 'budget_min', ascending: true },
  };
  const sortConfig = sortMap[sort] ?? sortMap.newest;

  // Fetch user projects with pagination
  let query = db(supabase)
    .from('projects')
    .select('id, title_ar, title_en, city_id, budget_min, budget_max, status, source, bid_count, created_at, timeline_start, timeline_end, slug_ar, slug_en, saudi_cities(name_ar, name_en)', { count: 'exact' })
    .eq('owner_id', user.id)
    .order(sortConfig.column, { ascending: sortConfig.ascending });

  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (search) {
    query = query.or(`title_ar.ilike.%${search}%,title_en.ilike.%${search}%`);
  }

  const { data: projects, count: totalCountRaw } = await query.range((page - 1) * perPage, page * perPage - 1);

  const items = (projects ?? []).map((p: Record<string, unknown>) => {
    const city = p.saudi_cities as { name_ar: string; name_en: string } | null;
    return {
      ...p,
      city_name_ar: city?.name_ar ?? null,
      city_name_en: city?.name_en ?? null,
    };
  }) as ProjectRow[];

  // Fetch thumbnail images for dashboard projects
  const projectIds = items.map((p) => p.id);
  if (projectIds.length > 0) {
    const { data: imageFiles } = await db(supabase)
      .from('project_files')
      .select('project_id, file_url')
      .in('project_id', projectIds)
      .eq('category', 'images')
      .order('created_at', { ascending: true });
    if (imageFiles) {
      const thumbMap: Record<string, string> = {};
      for (const img of imageFiles as { project_id: string; file_url: string }[]) {
        if (!thumbMap[img.project_id]) {
          thumbMap[img.project_id] = img.file_url;
        }
      }
      for (const item of items) {
        item.thumbnail_url = thumbMap[item.id] ?? null;
      }
    }
  }

  const totalCount = totalCountRaw ?? 0;
  const totalPages = Math.ceil(totalCount / perPage);

  // Stats — unfiltered counts
  const { count: draftCountRaw } = await db(supabase)
    .from('projects').select('id', { count: 'exact' })
    .eq('owner_id', user.id).eq('status', 'draft');
  const { count: pendingCountRaw } = await db(supabase)
    .from('projects').select('id', { count: 'exact' })
    .eq('owner_id', user.id).eq('status', 'pending');
  const { count: publishedCountRaw } = await db(supabase)
    .from('projects').select('id', { count: 'exact' })
    .eq('owner_id', user.id).eq('status', 'published');
  const { count: allCountRaw } = await db(supabase)
    .from('projects').select('id', { count: 'exact' })
    .eq('owner_id', user.id);

  const counts = {
    total: allCountRaw ?? 0,
    draft: draftCountRaw ?? 0,
    pending: pendingCountRaw ?? 0,
    published: publishedCountRaw ?? 0,
  };

  // Filter groups
  const filterGroups = [
    {
      key: 'status',
      label: tCommon('status'),
      options: [
        { value: 'draft', label: tCommon('draft') },
        { value: 'pending', label: tCommon('pending') },
        { value: 'published', label: tCommon('published') },
        { value: 'rejected', label: tCommon('rejected') },
        { value: 'awarded', label: tCommon('awarded') },
        { value: 'completed', label: tCommon('completed') },
      ],
    },
  ];

  const sortOptions = [
    { value: 'newest', label: tCommon('createdAt') + ' ↓' },
    { value: 'oldest', label: tCommon('createdAt') + ' ↑' },
    { value: 'budgetHigh', label: tCommon('budget') + ' ↓' },
    { value: 'budgetLow', label: tCommon('budget') + ' ↑' },
  ];

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
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        action={
          <Link href="/dashboard/projects/new">
            <Button>
              <Plus className="me-2 h-4 w-4" />
              {t('new')}
            </Button>
          </Link>
        }
      />

      {/* Status Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<FolderKanban className="h-5 w-5 text-primary" />} label={tCommon('all')} value={counts.total} />
        <StatCard icon={<FileText className="h-5 w-5 text-muted-foreground" />} label={tCommon('draft')} value={counts.draft} />
        <StatCard icon={<Clock className="h-5 w-5 text-warning" />} label={tCommon('pending')} value={counts.pending} color="yellow" />
        <StatCard icon={<FolderKanban className="h-5 w-5 text-success" />} label={tCommon('published')} value={counts.published} color="green" />
      </div>

      {/* Projects Table */}
      <ProjectsTableClient
        items={items}
        locale={locale}
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
