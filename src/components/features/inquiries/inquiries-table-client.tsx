'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useRealtime } from '@/hooks';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DashboardTableShell, type FilterGroup } from '@/components/features/dashboard-table-shell';
import { type BulkAction } from '@/components/features/bulk-action-bar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { Inbox, CheckCircle, Archive } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { getStatusVariant } from '@/components/features/status-badge-map';

// =============================================================================
// Types
// =============================================================================

export interface InquiryItem {
  id: string;
  product_name: string;
  product_slug?: string | null;
  sender_name: string;
  sender_slug?: string | null;
  quantity: number | null;
  requirements: string | null;
  status: string;
  created_at: string;
}

interface InquiriesTableClientProps {
  items: InquiryItem[];
  direction?: 'sent' | 'received';
  totalCount: number;
  currentPage: number;
  totalPages: number;
  translations: Record<string, string>;
  filterGroups: FilterGroup[];
  sortOptions: { value: string; label: string }[];
  onBulkRespond?: (ids: string[]) => Promise<void>;
  onBulkClose?: (ids: string[]) => Promise<void>;
}

// =============================================================================
// Component
// =============================================================================

export function InquiriesTableClient({
  items,
  direction = 'received',
  totalCount,
  currentPage,
  totalPages,
  translations: t,
  filterGroups,
  sortOptions,
  onBulkRespond,
  onBulkClose,
}: InquiriesTableClientProps) {
  const router = useRouter();

  // Live updates when inquiries change
  useRealtime({ channel: 'rt-inquiries', table: 'inquiries' });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const columns: ColumnDef<InquiryItem>[] = useMemo(
    () => [
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
        id: 'product',
        header: t.product || 'Product',
        cell: (row) => row.product_slug ? (
          <Link href={`/products/${row.product_slug}`} className="text-sm font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{row.product_name}</Link>
        ) : (
          <span className="text-sm font-medium text-foreground">{row.product_name}</span>
        ),
      },
      {
        id: 'sender',
        header: t.sender || 'Sender',
        cell: (row) => row.sender_slug ? (
          <Link href={`/partners/${row.sender_slug}`} className="text-sm text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{row.sender_name}</Link>
        ) : (
          <span className="text-sm text-foreground">{row.sender_name}</span>
        ),
        hiddenOnMobile: true,
      },
      {
        id: 'quantity',
        header: t.quantity || 'Qty',
        cell: (row) => (
          <span className="text-sm text-muted-foreground">
            {row.quantity ?? '—'}
          </span>
        ),
        hiddenOnMobile: true,
      },
      {
        id: 'requirements',
        header: t.requirements || 'Requirements',
        cell: (row) => (
          <span className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
            {row.requirements || '—'}
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
    if (onBulkRespond) {
      actions.push({
        id: 'respond',
        label: t.markResponded || 'Mark Responded',
        icon: <CheckCircle className="h-4 w-4" />,
        variant: 'secondary',
        onClick: (ids: string[]) => {
          startTransition(async () => {
            await onBulkRespond(ids);
            setSelectedIds([]);
          });
        },
      });
    }
    if (onBulkClose) {
      actions.push({
        id: 'close',
        label: t.close || 'Close',
        icon: <Archive className="h-4 w-4" />,
        variant: 'destructive',
        onClick: (ids: string[]) => {
          startTransition(async () => {
            await onBulkClose(ids);
            setSelectedIds([]);
          });
        },
      });
    }
    return actions;
  }, [onBulkRespond, onBulkClose, t, startTransition]);

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
          selectable={direction === 'received'}
          onSelectionChange={direction === 'received' ? setSelectedIds : undefined}
          onRowClick={(row) => router.push(`/dashboard/inquiries/${row.id}`)}
          emptyState={
            <EmptyState
              icon={<Inbox className="h-12 w-12" />}
              title={t.empty || 'No inquiries'}
              description={t.emptyDescription || ''}
            />
          }
        />
      </div>
    </DashboardTableShell>
  );
}
