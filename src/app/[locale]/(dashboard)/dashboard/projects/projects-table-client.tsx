'use client';

import { useMemo, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useRealtime } from '@/hooks';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DashboardTableShell, type FilterGroup } from '@/components/features/dashboard-table-shell';
import { PostStatusBadge } from '@/components/features/post-status-badge';
import { EmptyState } from '@/components/features/empty-state';
import { FolderKanban, ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatSAR, formatDate, getLocaleField, getEntitySlug } from '@/lib/utils';
import { getProxyUrl } from '@/lib/file-utils';
import type { ProjectRow } from './page';

interface Props {
  items: ProjectRow[];
  locale: string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  translations: Record<string, string>;
  filterGroups: FilterGroup[];
  sortOptions: { value: string; label: string }[];
}

const STATUS_LIST = [
  'draft', 'pending', 'published', 'rejected', 'awarded', 'completed', 'expired', 'closed',
] as const;

export function ProjectsTableClient({
  items,
  locale,
  totalCount,
  currentPage,
  totalPages,
  translations: t,
  filterGroups,
  sortOptions,
}: Props) {
  const router = useRouter();

  // Live updates when projects change
  useRealtime({ channel: 'rt-projects', table: 'projects' });

  const columns: ColumnDef<ProjectRow>[] = useMemo(() => [
    {
      id: 'title',
      header: t.name,
      cell: (row) => {
        const title = getLocaleField(row as unknown as Record<string, unknown>, 'title', locale);
        return (
          <div className="flex items-center gap-3">
            {row.thumbnail_url ? (
              <img
                src={getProxyUrl(row.thumbnail_url)}
                alt=""
                className="h-9 w-14 shrink-0 rounded object-cover"
              />
            ) : (
              <div className="flex h-9 w-14 shrink-0 items-center justify-center rounded bg-muted">
                <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
              </div>
            )}
            <div className="min-w-0">
              <span className="font-medium text-foreground line-clamp-1">{title}</span>
              {row.source === 'subcontract' && (
                <Badge variant="secondary" className="mt-0.5">{t.subcontract}</Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: t.status,
      cell: (row) => {
        const s = STATUS_LIST.includes(row.status as (typeof STATUS_LIST)[number])
          ? (row.status as (typeof STATUS_LIST)[number])
          : 'draft';
        return <PostStatusBadge status={s} />;
      },
    },
    {
      id: 'city_id',
      header: t.city,
      cell: (row) => {
        const cityName = locale === 'ar' ? row.city_name_ar : row.city_name_en;
        return <span className="text-muted-foreground">{cityName || '—'}</span>;
      },
      hiddenOnMobile: true,
    },
    {
      id: 'budget',
      header: t.budget,
      cell: (row) => {
        if (!row.budget_min && !row.budget_max) return <span className="text-muted-foreground">—</span>;
        if (row.budget_min && row.budget_max)
          return <span>{formatSAR(row.budget_min)} – {formatSAR(row.budget_max)}</span>;
        if (row.budget_max) return <span>{t.upTo} {formatSAR(row.budget_max)}</span>;
        return <span>{t.from} {formatSAR(row.budget_min!)}</span>;
      },
      hiddenOnMobile: true,
    },
    {
      id: 'bids',
      header: t.bids,
      cell: (row) => (
        <span className="font-semibold text-foreground">{row.bid_count}</span>
      ),
    },
    {
      id: 'created',
      header: t.created,
      cell: (row) => (
        <span className="text-muted-foreground">{formatDate(row.created_at)}</span>
      ),
      hiddenOnMobile: true,
    },
  ], [locale, t]);

  const handleRowClick = useCallback(
    (row: ProjectRow) => {
      router.push(`/dashboard/projects/${getEntitySlug(row, locale)}`);
    },
    [router, locale],
  );

  return (
    <DashboardTableShell
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      filterGroups={filterGroups}
      sortOptions={sortOptions}
      searchable
    >
      <DataTable
        data={items}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={handleRowClick}
        emptyState={
          <EmptyState
            icon={<FolderKanban className="h-12 w-12" />}
            title={t.noProjects}
            description={t.noProjectsDesc}
            actionLabel={t.createProject}
            actionHref="/dashboard/projects/new"
          />
        }
      />
    </DashboardTableShell>
  );
}
