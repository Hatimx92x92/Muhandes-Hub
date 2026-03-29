// =============================================================================
// Projects Browse Page — public project listing with search & filters
// =============================================================================

import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { MapPin, Banknote, Calendar, Users, FolderKanban, Search } from 'lucide-react';
import { formatSAR, formatDate, getLocaleField, getEntitySlug } from '@/lib/utils';
import { getTranslations, getLocale } from 'next-intl/server';
import { BrowsePagination } from '@/components/features/browse-pagination';

const PAGE_SIZE = 24;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; source?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const t = await getTranslations('public.projects');
  const locale = await getLocale();
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = db(supabase)
    .from('projects')
    .select('id, title_ar, title_en, description_ar, description_en, city_id, budget_min, budget_max, source, classification, bid_count, created_at, timeline_start, timeline_end, slug_ar, slug_en', { count: 'exact' })
    .eq('status', 'published');

  if (params.q) {
    const pattern = `%${params.q}%`;
    query = query.or(`title_ar.ilike.${pattern},title_en.ilike.${pattern},description_ar.ilike.${pattern}`);
  }

  if (params.city) {
    query = query.eq('city_id', params.city);
  }
  if (params.source) {
    query = query.eq('source', params.source);
  }

  switch (params.sort) {
    case 'budget':
      query = query.order('budget_max', { ascending: false, nullsFirst: false });
      break;
    case 'bids':
      query = query.order('bid_count', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data: projects, count } = await query.range(from, to);
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const items = (projects ?? []) as Array<{
    id: string;
    title_ar: string;
    title_en: string;
    description_ar: string;
    description_en: string;
    city_id: string;
    budget_min: number | null;
    budget_max: number | null;
    source: string;
    classification: string | null;
    bid_count: number;
    created_at: string;
    timeline_start: string | null;
    timeline_end: string | null;
  }>;

  return (
    <div className="py-16">
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
            name="city"
            defaultValue={params.city}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
          >
            <option value="">{t('allCities')}</option>
            <option value="riyadh">{t('riyadh')}</option>
            <option value="jeddah">{t('jeddah')}</option>
            <option value="dammam">{t('dammam')}</option>
            <option value="mecca">{t('mecca')}</option>
            <option value="medina">{t('medina')}</option>
          </select>
          <select
            name="source"
            defaultValue={params.source}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
          >
            <option value="">{t('allTypes')}</option>
            <option value="owner">{t('ownerSource')}</option>
            <option value="subcontract">{t('subcontractSource')}</option>
          </select>
          <select
            name="sort"
            defaultValue={params.sort}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
          >
            <option value="recent">{t('sortRecent')}</option>
            <option value="budget">{t('sortBudget')}</option>
            <option value="bids">{t('sortBids')}</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
          >
            {t('search')}
          </button>
        </form>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {t('resultCount', { count: count ?? items.length })}
      </p>

      {items.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-12 w-12" />}
          title={t('noProjects')}
          description={t('noProjectsDesc')}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((project) => (
            <PublicProjectCard key={project.id} project={project} locale={locale} t={t} />
          ))}
        </div>
      )}

      <BrowsePagination
        currentPage={currentPage}
        totalPages={totalPages}
        searchParams={params as Record<string, string | undefined>}
        labels={{ previous: t('previous'), next: t('next') }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public Project Card
// ---------------------------------------------------------------------------
function PublicProjectCard({
  project,
  locale,
  t,
}: {
  project: {
    id: string;
    title_ar: string;
    title_en: string;
    description_ar: string;
    description_en: string;
    city_id: string;
    budget_min: number | null;
    budget_max: number | null;
    source: string;
    classification: string | null;
    bid_count: number;
    created_at: string;
    timeline_start: string | null;
    slug_ar?: string | null;
    slug_en?: string | null;
  };
  locale: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  const title = getLocaleField(project, 'title', locale);
  const descField = locale === 'ar' ? project.description_ar : (project.description_en || project.description_ar);
  const desc = descField?.slice(0, 120) + (descField?.length > 120 ? '…' : '');

  return (
    <Link href={`/projects/${getEntitySlug(project, locale)}`}>
      <Card className="h-full p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20">
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-foreground line-clamp-2">{title}</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {project.source === 'subcontract' && (
                <Badge variant="info">{t('subcontract')}</Badge>
              )}
              {project.classification && (
                <Badge variant="outline">{t('category')} {project.classification.toUpperCase()}</Badge>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">{desc}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {project.city_id && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {project.city_id}
              </span>
            )}
            {(project.budget_min || project.budget_max) && (
              <span className="flex items-center gap-1">
                <Banknote className="h-3 w-3" />
                {project.budget_max
                  ? formatSAR(project.budget_max)
                  : formatSAR(project.budget_min!)}
              </span>
            )}
            {project.timeline_start && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(project.timeline_start)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              {t('bidCount', { count: project.bid_count })}
            </span>
            <span className="text-muted-foreground">
              {formatDate(project.created_at)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
