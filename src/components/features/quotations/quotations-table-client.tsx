'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useRealtime } from '@/hooks';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DashboardTableShell, type FilterGroup } from '@/components/features/dashboard-table-shell';
import { type BulkAction } from '@/components/features/bulk-action-bar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { Receipt, Trash2, Send } from 'lucide-react';
import { formatSAR, formatDate } from '@/lib/utils';
import { getStatusVariant } from '@/components/features/status-badge-map';

// =============================================================================
// Types
// =============================================================================

export interface QuotationItem {
  id: string;
  number: string;
  mode: string;
  client_name: string | null;
  subtotal: number;
  vat_amount: number;
  total: number;
  validity_days: number;
  status: string;
  created_at: string;
}

interface QuotationsTableClientProps {
  items: QuotationItem[];
  direction: 'sent' | 'received';
  totalCount: number;
  currentPage: number;
  totalPages: number;
  translations: Record<string, string>;
  filterGroups: FilterGroup[];
  sortOptions: { value: string; label: string }[];
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onBulkSend?: (ids: string[]) => Promise<void>;
}

// =============================================================================
// Component
// =============================================================================

export function QuotationsTableClient({
  items,
  direction,
  totalCount,
  currentPage,
  totalPages,
  translations: t,
  filterGroups,
  sortOptions,
  onBulkDelete,
  onBulkSend,
}: QuotationsTableClientProps) {
  const router = useRouter();

  // Live updates when quotations change
  useRealtime({ channel: 'rt-quotations', table: 'quotations' });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const columns: ColumnDef<QuotationItem>[] = useMemo(
    () => [
      {
        id: 'number',
        header: t.number || '#',
        cell: (row) => (
          <span className="font-mono text-sm font-semibold">{row.number}</span>
        ),
      },
      {
        id: 'status',
        header: t.status || 'Status',
        cell: (row) => (
          <Badge variant={getStatusVariant(row.status)}>
            {t[`status_${row.status}`] || row.status}
          </Badge>
        ),
      },
      {
        id: 'client',
        header: t.client || 'Client',
        cell: (row) => (
          <span className="text-sm text-foreground">
            {row.client_name || '—'}
          </span>
        ),
        hiddenOnMobile: true,
      },
      {
        id: 'total',
        header: t.total || 'Total',
        cell: (row) => (
          <span className="text-sm font-medium">{formatSAR(row.total)}</span>
        ),
      },
      {
        id: 'validity',
        header: t.validity || 'Validity',
        cell: (row) => (
          <span className="text-xs text-muted-foreground">
            {row.validity_days} {t.days || 'days'}
          </span>
        ),
        hiddenOnMobile: true,
      },
      {
        id: 'created',
        header: t.created || 'Created',
        cell: (row) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.created_at)}
          </span>
        ),
        hiddenOnMobile: true,
      },
    ],
    [t],
  );

  const bulkActions: BulkAction[] = useMemo(() => {
    const actions: BulkAction[] = [];
    if (direction === 'sent' && onBulkSend) {
      actions.push({
        id: 'send',
        label: t.markSent || 'Mark as Sent',
        icon: <Send className="h-4 w-4" />,
        variant: 'secondary',
        onClick: (ids: string[]) => {
          startTransition(async () => {
            await onBulkSend(ids);
            setSelectedIds([]);
          });
        },
      });
    }
    if (direction === 'sent' && onBulkDelete) {
      actions.push({
        id: 'delete',
        label: t.deleteDraft || 'Delete',
        icon: <Trash2 className="h-4 w-4" />,
        variant: 'destructive',
        onClick: (ids: string[]) => {
          startTransition(async () => {
            await onBulkDelete(ids);
            setSelectedIds([]);
          });
        },
      });
    }
    return actions;
  }, [direction, onBulkDelete, onBulkSend, t, startTransition]);

  return (
    <DashboardTableShell
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      filterGroups={filterGroups}
      sortOptions={sortOptions}
      searchable
      preserveParams={['view']}
      selectedIds={selectedIds}
      selectedCount={selectedIds.length}
      bulkActions={bulkActions}
      onSelectionClear={() => setSelectedIds([])}
    >
      <div className={isPending ? 'opacity-60 pointer-events-none' : ''}>
        <DataTable
          columns={columns}
          data={items}
          getRowId={(row) => row.id}
          selectable={direction === 'sent'}
          onSelectionChange={setSelectedIds}
          onRowClick={(row) => router.push(`/dashboard/quotations/${row.id}`)}
          emptyState={
            <EmptyState
              icon={<Receipt className="h-12 w-12" />}
              title={direction === 'sent' ? (t.noSent || 'No sent quotations') : (t.noReceived || 'No received quotations')}
              description={direction === 'sent' ? (t.noSentDesc || '') : (t.noReceivedDesc || '')}
            />
          }
        />
      </div>
    </DashboardTableShell>
  );
}
