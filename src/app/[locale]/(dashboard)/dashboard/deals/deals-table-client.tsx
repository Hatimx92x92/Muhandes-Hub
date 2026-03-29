'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { BulkActionBar, type BulkAction } from '@/components/features/bulk-action-bar';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { formatSAR, formatDate } from '@/lib/utils';
import { Handshake } from 'lucide-react';
import type { DealItem } from './page';

// =============================================================================
// Deals Table Client Wrapper — role/type aware
// =============================================================================

const statusBadge: Record<string, BadgeProps['variant']> = {
  active: 'info',
  in_progress: 'pending',
  completed: 'success',
  cancelled: 'rejected',
  disputed: 'destructive',
};

interface DealsTableClientProps {
  items: DealItem[];
  userId: string;
  translations: Record<string, string>;
}

export function DealsTableClient({ items, userId, translations: t }: DealsTableClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
          <Badge variant={statusBadge[row.status] ?? 'secondary'}>
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
          return (
            <span className="text-xs font-medium text-muted-foreground">
              {isBuyer ? t.youAreBuyer : t.youAreSeller}
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
          <span className="text-xs text-muted-foreground">{formatDate(row.created_at)}</span>
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

  const bulkActions: BulkAction[] = useMemo(() => [], []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Handshake className="h-12 w-12" />}
        title={t.noDeals}
        description={t.noDealsDesc}
      />
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={items}
        getRowId={(row) => row.id}
        onRowClick={handleRowClick}
        selectable
        onSelectionChange={setSelectedIds}
      />
      {bulkActions.length > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.length}
          selectedIds={selectedIds}
          actions={bulkActions}
          onClear={clearSelection}
        />
      )}
    </>
  );
}
