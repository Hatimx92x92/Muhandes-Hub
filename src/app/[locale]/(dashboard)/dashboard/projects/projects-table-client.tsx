'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { BulkActionBar, type BulkAction } from '@/components/features/bulk-action-bar';
import { PostStatusBadge } from '@/components/features/post-status-badge';
import { EmptyState } from '@/components/features/empty-state';
import { FolderKanban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatSAR, formatDate, getLocaleField, getEntitySlug } from '@/lib/utils';
import type { ProjectRow } from './page';

interface Props {
  items: ProjectRow[];
  locale: string;
  translations: Record<string, string>;
}

const STATUS_LIST = [
  'draft', 'pending', 'published', 'rejected', 'awarded', 'completed', 'expired', 'closed',
] as const;

export function ProjectsTableClient({ items, locale, translations: t }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const columns: ColumnDef<ProjectRow>[] = [
    {
      id: 'title',
      header: t.name,
      cell: (row) => {
        const title = getLocaleField(row as unknown as Record<string, unknown>, 'title', locale);
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{title}</span>
            {row.source === 'subcontract' && (
              <Badge variant="secondary">{t.subcontract}</Badge>
            )}
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
      cell: (row) => <span className="text-muted-foreground">{row.city_id || '—'}</span>,
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
  ];

  const bulkActions: BulkAction[] = [
    // Placeholder for future bulk actions like delete
  ];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<FolderKanban className="h-12 w-12" />}
        title={t.noProjects}
        description={t.noProjectsDesc}
        actionLabel={t.createProject}
        actionHref="/dashboard/projects/new"
      />
    );
  }

  return (
    <>
      <DataTable
        data={items}
        columns={columns}
        getRowId={(row) => row.id}
        selectable
        onSelectionChange={setSelected}
        onRowClick={(row) =>
          router.push(`/dashboard/projects/${getEntitySlug(row, locale)}`)
        }
      />

      {selected.length > 0 && (
        <BulkActionBar
          selectedCount={selected.length}
          selectedIds={selected}
          actions={bulkActions}
          onClear={() => setSelected([])}
        />
      )}
    </>
  );
}
