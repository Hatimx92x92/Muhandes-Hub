'use client';

import { useMemo, useCallback } from 'react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { AdminTableShell, type FilterGroup } from '@/components/features/admin/admin-table-shell';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { useRouter } from '@/i18n/navigation';
import { Handshake } from 'lucide-react';
import { formatSAR } from '@/lib/utils';
import type { AdminDealRow } from '@/actions/admin/queries';

// =============================================================================
// Admin Deals Table Client
// =============================================================================

const STATUS_BADGE: Record<string, string> = {
  active: 'active',
  in_progress: 'pending',
  completed: 'completed',
  cancelled: 'cancelled',
  disputed: 'destructive',
};

interface DealsTableClientProps {
  data: AdminDealRow[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  translations: Record<string, string>;
}

export function DealsTableClient({ data, totalCount, currentPage, totalPages, translations: t }: DealsTableClientProps) {
  const router = useRouter();

  const columns: ColumnDef<AdminDealRow>[] = useMemo(
    () => [
      {
        id: 'dealId',
        header: t['col_dealId'],
        cell: (row) => (
          <span className="font-mono text-sm font-medium">#{row.id.slice(0, 8)}</span>
        ),
      },
      {
        id: 'type',
        header: t['col_dealType'],
        hiddenOnMobile: true,
        cell: (row) => (
          <Badge variant="outline" className="text-xs">
            {t[`dealType_${row.deal_type}`] ?? row.deal_type}
          </Badge>
        ),
      },
      {
        id: 'status',
        header: t['col_status'],
        sortKey: 'status',
        cell: (row) => (
          <Badge variant={(STATUS_BADGE[row.status] ?? 'secondary') as 'active' | 'pending' | 'completed' | 'cancelled' | 'destructive' | 'secondary'}>
            {t[`dealStatus_${row.status}`] ?? row.status}
          </Badge>
        ),
      },
      {
        id: 'value',
        header: t['col_value'],
        sortKey: 'value',
        cell: (row) => (
          <span className="font-medium">{formatSAR(Number(row.value ?? 0))}</span>
        ),
      },
      {
        id: 'created',
        header: t['col_created'],
        sortKey: 'created_at',
        hiddenOnMobile: true,
        cell: (row) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.created_at).toLocaleDateString()}
          </span>
        ),
      },
    ],
    [t],
  );

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'status',
        label: t['col_status'],
        options: [
          { value: 'active', label: t['dealStatus_active'] },
          { value: 'in_progress', label: t['dealStatus_in_progress'] },
          { value: 'completed', label: t['dealStatus_completed'] },
          { value: 'cancelled', label: t['dealStatus_cancelled'] },
          { value: 'disputed', label: t['dealStatus_disputed'] },
        ],
      },
    ],
    [t],
  );

  const sortOptions = useMemo(
    () => [
      { value: 'created_at:desc', label: t['sort_newest'] },
      { value: 'created_at:asc', label: t['sort_oldest'] },
      { value: 'value:desc', label: t['sort_valueHigh'] },
      { value: 'value:asc', label: t['sort_valueLow'] },
    ],
    [t],
  );

  const handleRowClick = useCallback(
    (row: AdminDealRow) => {
      router.push(`/admin/deals/${row.id}`);
    },
    [router],
  );

  return (
    <AdminTableShell
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      filterGroups={filterGroups}
      sortOptions={sortOptions}
      exportConfig={{
        filename: `admin-deals-${new Date().toISOString().slice(0, 10)}`,
        headers: [
          { key: 'id', label: t['col_dealId'] },
          { key: 'deal_type', label: t['col_dealType'] },
          { key: 'status', label: t['col_status'] },
          { key: 'value', label: t['col_value'] },
          { key: 'created_at', label: t['col_created'] },
        ],
        data: data.map((row) => ({
          id: row.id.slice(0, 8),
          deal_type: t[`dealType_${row.deal_type}`] ?? row.deal_type,
          status: t[`dealStatus_${row.status}`] ?? row.status,
          value: Number(row.value ?? 0),
          created_at: new Date(row.created_at).toLocaleDateString(),
        })),
      }}
    >
      <DataTable
        columns={columns}
        data={data}
        getRowId={(row) => row.id}
        onRowClick={handleRowClick}
        stickyHeader
        maxHeight="600px"
        emptyState={
          <EmptyState
            icon={<Handshake className="h-12 w-12" />}
            title={t['noDeals']}
          />
        }
      />
    </AdminTableShell>
  );
}
