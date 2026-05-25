'use client';

import { useMemo, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { useRealtime } from '@/hooks';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DashboardTableShell, type FilterGroup } from '@/components/features/dashboard-table-shell';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { getStatusVariant } from '@/components/features/status-badge-map';
import { formatSAR, formatDate } from '@/lib/utils';
import { Handshake } from 'lucide-react';
import type { DealItem } from './page';

// =============================================================================
// Deals Table Client Wrapper — role/type aware with DashboardTableShell
// =============================================================================

interface DealsTableClientProps {
  items: DealItem[];
  userId: string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  translations: Record<string, string>;
  filterGroups: FilterGroup[];
  sortOptions: { value: string; label: string }[];
}

export function DealsTableClient({
  items,
  userId,
  totalCount,
  currentPage,
  totalPages,
  translations: t,
  filterGroups,
  sortOptions,
}: DealsTableClientProps) {
  const router = useRouter();
  const locale = useLocale();

  // Live updates when deals change
  useRealtime({ channel: 'rt-deals', table: 'deals' });

  const columns: ColumnDef<DealItem>[] = useMemo(
    () => [
      {
        id: 'title',
        header: t.deal,
        cell: (row) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {row.title_slug || `${t.deal} #${row.id.slice(0, 8)}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {t[`trigger_${row.trigger_source}`] ?? row.trigger_source}
            </p>
          </div>
        ),
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
        id: 'type',
        header: t[`type_deal_project`] ? '' : '',
        cell: (row) => (
          <Badge variant="outline" className="text-xs">
            {t[`type_${row.deal_type}`] ?? row.deal_type}
          </Badge>
        ),
        hiddenOnMobile: true,
      },
      {
        id: 'yourRole',
        header: t.role,
        cell: (row) => {
          const isBuyer = row.buyer_id === userId;
          const roleKey = row.deal_type === 'deal_project'
            ? (isBuyer ? 'youAreProjectOwner' : 'youAreContractor')
            : (isBuyer ? 'youAreBuyerRole' : 'youAreSupplier');
          return (
            <span className="text-xs font-medium text-muted-foreground">
              {t[roleKey] ?? (isBuyer ? t.youAreBuyer : t.youAreSeller)}
            </span>
          );
        },
        hiddenOnMobile: true,
      },
      {
        id: 'value',
        header: t.value,
        cell: (row) => (
          <span className="font-medium">{formatSAR(Number(row.value) || 0)}</span>
        ),
      },
      {
        id: 'progress',
        header: t.progress,
        cell: (row) => (
          <div className="min-w-[120px] space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${row.seller_progress}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{row.seller_progress}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-success" style={{ width: `${row.buyer_progress}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{row.buyer_progress}%</span>
            </div>
          </div>
        ),
        hiddenOnMobile: true,
      },
      {
        id: 'created',
        header: t.created,
        cell: (row) => (
          <span className="text-xs text-muted-foreground">{formatDate(row.created_at, locale)}</span>
        ),
        hiddenOnMobile: true,
      },
    ],
    [t, userId],
  );

  const handleRowClick = useCallback(
    (row: DealItem) => {
      router.push(`/dashboard/deals/${row.title_slug || row.id}`);
    },
    [router],
  );

  const emptyState = (
    <EmptyState
      icon={<Handshake className="h-12 w-12" />}
      title={t.noDeals}
      description={t.noDealsDesc}
    />
  );

  return (
    <DashboardTableShell
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      searchable
      filterGroups={filterGroups}
      sortOptions={sortOptions}
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
