'use client';

import { useMemo, useCallback } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { useRealtime } from '@/hooks';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DashboardTableShell, type FilterGroup } from '@/components/features/dashboard-table-shell';
import { EmptyState } from '@/components/features/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getStatusVariant } from '@/components/features/status-badge-map';
import { formatSAR, formatDate } from '@/lib/utils';
import { Gavel, Inbox, ExternalLink } from 'lucide-react';
import type { BidItem } from './page';

// =============================================================================
// Bids Table — Client wrapper with DashboardTableShell + DataTable
// =============================================================================

interface BidsTableClientProps {
  items: BidItem[];
  direction: 'sent' | 'received';
  totalCount: number;
  currentPage: number;
  totalPages: number;
  translations: Record<string, string>;
  filterGroups: FilterGroup[];
  sortOptions: { value: string; label: string }[];
}

export function BidsTableClient({
  items,
  direction,
  totalCount,
  currentPage,
  totalPages,
  translations: t,
  filterGroups,
  sortOptions,
}: BidsTableClientProps) {
  const router = useRouter();
  const locale = useLocale();

  // Live updates when bids change
  useRealtime({ channel: 'rt-bids', table: 'bids' });

  const sentColumns: ColumnDef<BidItem>[] = useMemo(
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
          <Badge variant={getStatusVariant(row.status)}>
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
      {
        id: 'deal',
        header: '',
        cell: (row) => {
          if (row.status !== 'awarded' || !row.deal_slug) return null;
          const dealTitle = locale === 'ar'
            ? (row.project_title_ar || row.project_title_en)
            : (row.project_title_en || row.project_title_ar);
          return (
            <Link
              href={`/dashboard/deals/${row.deal_slug}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Button size="sm" variant="outline" className="gap-1.5 whitespace-nowrap">
                <ExternalLink className="h-3.5 w-3.5" />
                {dealTitle || t.viewDeal}
              </Button>
            </Link>
          );
        },
      },
    ],
    [t, locale],
  );

  const receivedColumns: ColumnDef<BidItem>[] = useMemo(
    () => [
      {
        id: 'contractor',
        header: t.contractorName,
        cell: (row) => {
          const name = locale === 'ar'
            ? (row.contractor_company_ar || row.contractor_company_en || '—')
            : (row.contractor_company_en || row.contractor_company_ar || '—');
          return (
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{name}</p>
            </div>
          );
        },
      },
      {
        id: 'project',
        header: t.projectName,
        cell: (row) => {
          const title = locale === 'ar'
            ? (row.project_title_ar || row.project_title_en || '—')
            : (row.project_title_en || row.project_title_ar || '—');
          return (
            <div className="min-w-0">
              <p className="truncate text-sm text-muted-foreground">{title}</p>
            </div>
          );
        },
        hiddenOnMobile: true,
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
          <Badge variant={getStatusVariant(row.status)}>
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
      {
        id: 'deal',
        header: '',
        cell: (row) => {
          if (row.status !== 'awarded' || !row.deal_slug) return null;
          const dealTitle = locale === 'ar'
            ? (row.project_title_ar || row.project_title_en)
            : (row.project_title_en || row.project_title_ar);
          return (
            <Link
              href={`/dashboard/deals/${row.deal_slug}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Button size="sm" variant="outline" className="gap-1.5 whitespace-nowrap">
                <ExternalLink className="h-3.5 w-3.5" />
                {dealTitle || t.viewDeal}
              </Button>
            </Link>
          );
        },
      },
    ],
    [t, locale],
  );

  const columns = direction === 'sent' ? sentColumns : receivedColumns;

  const handleRowClick = useCallback(
    (row: BidItem) => {
      const slug = (locale === 'ar' ? row.project_slug_ar : row.project_slug_en) || row.project_slug_ar || row.project_slug_en || row.project_id;
      if (direction === 'sent') {
        // Awarded bid: go directly to the deal workspace
        if (row.status === 'awarded' && row.deal_slug) {
          router.push(`/dashboard/deals/${row.deal_slug}`);
        } else {
          router.push(`/projects/${slug}`);
        }
      } else {
        // Project owner: go to bids comparison page
        router.push(`/dashboard/projects/${slug}/bids`);
      }
    },
    [router, locale, direction],
  );

  const emptyState = (
    <EmptyState
      icon={direction === 'sent' ? <Gavel className="h-12 w-12" /> : <Inbox className="h-12 w-12" />}
      title={t.noBids}
      description={t.noBidsDesc}
      actionLabel={direction === 'sent' ? t.browseProjects : undefined}
      actionHref={direction === 'sent' ? '/dashboard/projects' : undefined}
    />
  );

  return (
    <DashboardTableShell
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      searchable
      searchPlaceholder={t.searchPlaceholder}
      filterGroups={filterGroups}
      sortOptions={sortOptions}
      preserveParams={['view']}
    >
      <DataTable
        columns={columns}
        data={items}
        getRowId={(row) => row.id}
        onRowClick={handleRowClick}
        emptyState={emptyState}
      />
    </DashboardTableShell>
  );
}
