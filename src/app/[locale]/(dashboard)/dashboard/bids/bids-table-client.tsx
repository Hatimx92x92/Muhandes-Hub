'use client';

import { useMemo, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { EmptyState } from '@/components/features/empty-state';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { formatSAR, formatDate, getLocaleField } from '@/lib/utils';
import { Gavel } from 'lucide-react';
import type { BidItem } from './page';

// =============================================================================
// My Bids Table — Client wrapper with DataTable
// =============================================================================

const statusBadge: Record<string, BadgeProps['variant']> = {
  pending: 'pending',
  shortlisted: 'info',
  awarded: 'success',
  rejected: 'destructive',
};

interface BidsTableClientProps {
  items: BidItem[];
  translations: Record<string, string>;
}

export function BidsTableClient({ items, translations: t }: BidsTableClientProps) {
  const router = useRouter();
  const locale = useLocale();

  const columns: ColumnDef<BidItem>[] = useMemo(
    () => [
      {
        id: 'project',
        header: t.projectName,
        cell: (row) => {
          const title = locale === 'ar'
            ? (row.project_title_ar || row.project_title_en || '—')
            : (row.project_title_en || row.project_title_ar || '—');
          return (
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{title}</p>
            </div>
          );
        },
      },
      {
        id: 'amount',
        header: t.amount,
        cell: (row) => (
          <span className="font-medium">{formatSAR(row.amount)}</span>
        ),
      },
      {
        id: 'timeline',
        header: t.timeline,
        cell: (row) => (
          <span className="text-sm text-muted-foreground">
            {row.timeline_days} {t.days.replace('{count} ', '')}
          </span>
        ),
        hiddenOnMobile: true,
      },
      {
        id: 'status',
        header: t.status,
        cell: (row) => (
          <Badge variant={statusBadge[row.status] ?? 'secondary'}>
            {t[`status_${row.status}`] ?? row.status}
          </Badge>
        ),
      },
      {
        id: 'submitted',
        header: t.submittedAt,
        cell: (row) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.submitted_at)}
          </span>
        ),
        hiddenOnMobile: true,
      },
    ],
    [t, locale],
  );

  const handleRowClick = useCallback(
    (row: BidItem) => {
      const slug = row.project_slug || row.project_id;
      router.push(`/dashboard/projects/${slug}`);
    },
    [router],
  );

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Gavel className="h-12 w-12" />}
        title={t.noBids}
        description={t.noBidsDesc}
        actionLabel={t.browseProjects}
        actionHref="/dashboard/projects"
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={items}
      getRowId={(row) => row.id}
      onRowClick={handleRowClick}
    />
  );
}
