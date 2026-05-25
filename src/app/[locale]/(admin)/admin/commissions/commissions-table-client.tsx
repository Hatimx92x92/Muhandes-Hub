'use client';

import { useState, useMemo, useTransition } from 'react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { AdminTableShell, type FilterGroup } from '@/components/features/admin/admin-table-shell';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { AdminCommissionActions } from '@/components/features/admin/commission-actions';
import { CommissionDetailModal } from '@/components/features/admin/commission-detail-modal';
import { Banknote, CheckCircle } from 'lucide-react';
import { formatSAR } from '@/lib/utils';
import { LocaleDate } from '@/components/ui/locale-date';
import type { AdminCommissionRow } from '@/actions/admin/queries';
import type { BulkAction } from '@/components/features/bulk-action-bar';
import { approveCommissionPayment } from '@/actions/admin/commissions';

// =============================================================================
// Admin Commissions Table Client
// =============================================================================

const STATUS_BADGE: Record<string, string> = {
  pending: 'pending',
  approved: 'info',
  paid: 'success',
  disputed: 'destructive',
  overdue: 'warning',
};

interface CommissionsTableClientProps {
  data: AdminCommissionRow[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  translations: Record<string, string>;
}

export function CommissionsTableClient({ data, totalCount, currentPage, totalPages, translations: t }: CommissionsTableClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  const columns: ColumnDef<AdminCommissionRow>[] = useMemo(
    () => [
      {
        id: 'id',
        header: t['col_commissionId'],
        cell: (row) => (
          <span className="font-mono text-sm font-medium">#{row.id.slice(0, 8)}</span>
        ),
      },
      {
        id: 'seller',
        header: t['col_seller'] ?? 'Seller',
        hiddenOnMobile: true,
        cell: (row) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.seller_name ?? '—'}</p>
            {row.seller_company && <p className="truncate text-xs text-muted-foreground">{row.seller_company}</p>}
          </div>
        ),
      },
      {
        id: 'status',
        header: t['col_status'],
        sortKey: 'status',
        cell: (row) => (
          <Badge variant={(STATUS_BADGE[row.status] ?? 'secondary') as 'pending' | 'info' | 'success' | 'destructive' | 'warning' | 'secondary'}>
            {t[`commStatus_${row.status}`] ?? row.status}
          </Badge>
        ),
      },
      {
        id: 'amount',
        header: t['col_amount'],
        sortKey: 'amount',
        cell: (row) => (
          <span className="font-medium">{formatSAR(Number(row.amount ?? 0))}</span>
        ),
      },
      {
        id: 'vat',
        header: t['col_vat'],
        hiddenOnMobile: true,
        cell: (row) => (
          <span className="text-sm text-muted-foreground">{formatSAR(Number(row.vat_amount ?? 0))}</span>
        ),
      },
      {
        id: 'total',
        header: t['col_total'],
        sortKey: 'total',
        cell: (row) => (
          <span className="font-semibold">{formatSAR(Number(row.total ?? 0))}</span>
        ),
      },
      {
        id: 'dueDate',
        header: t['col_dueDate'],
        sortKey: 'due_date',
        hiddenOnMobile: true,
        cell: (row) => (
          <LocaleDate date={row.due_date} className="text-xs text-muted-foreground" />
        ),
      },
      {
        id: 'created',
        header: t['col_created'],
        sortKey: 'created_at',
        hiddenOnMobile: true,
        cell: (row) => (
          <LocaleDate date={row.created_at} className="text-xs text-muted-foreground" />
        ),
      },
      {
        id: 'actions',
        header: t['col_actions'],
        cell: (row) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <CommissionDetailModal commission={row} translations={t} />
            {(row.status === 'pending' || row.status === 'approved' || row.status === 'disputed') && (
              <AdminCommissionActions
                commissionId={row.id}
                currentStatus={row.status}
              />
            )}
          </div>
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
          { value: 'pending', label: t['commStatus_pending'] },
          { value: 'approved', label: t['commStatus_approved'] },
          { value: 'paid', label: t['commStatus_paid'] },
          { value: 'disputed', label: t['commStatus_disputed'] },
          { value: 'overdue', label: t['commStatus_overdue'] },
        ],
      },
    ],
    [t],
  );

  const sortOptions = useMemo(
    () => [
      { value: 'created_at:desc', label: t['sort_newest'] },
      { value: 'created_at:asc', label: t['sort_oldest'] },
      { value: 'total:desc', label: t['sort_amountHigh'] },
      { value: 'total:asc', label: t['sort_amountLow'] },
      { value: 'due_date:asc', label: t['sort_dueSoon'] },
    ],
    [t],
  );

  const bulkActions: BulkAction[] = useMemo(
    () => [
      {
        id: 'approve',
        label: t['action_approve'],
        icon: <CheckCircle className="h-4 w-4" />,
        variant: 'default' as const,
        onClick: (ids: string[]) => {
          startTransition(async () => {
            for (const id of ids) {
              const row = data.find((d) => d.id === id);
              if (row && (row.status === 'pending' || row.status === 'approved')) {
                await approveCommissionPayment(row.id);
              }
            }
            setSelectedIds([]);
          });
        },
      },
    ],
    [t, data],
  );

  return (
    <AdminTableShell
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      filterGroups={filterGroups}
      sortOptions={sortOptions}
      selectedIds={selectedIds}
      selectedCount={selectedIds.length}
      bulkActions={bulkActions}
      onSelectionClear={() => setSelectedIds([])}
      exportConfig={{
        filename: `admin-commissions-${new Date().toISOString().slice(0, 10)}`,
        headers: [
          { key: 'id', label: t['col_commissionId'] },
          { key: 'status', label: t['col_status'] },
          { key: 'amount', label: t['col_amount'] },
          { key: 'vat_amount', label: t['col_vat'] },
          { key: 'total', label: t['col_total'] },
          { key: 'due_date', label: t['col_dueDate'] },
          { key: 'created_at', label: t['col_created'] },
        ],
        data: data.map((row) => ({
          id: row.id.slice(0, 8),
          status: t[`commStatus_${row.status}`] ?? row.status,
          amount: Number(row.amount ?? 0),
          vat_amount: Number(row.vat_amount ?? 0),
          total: Number(row.total ?? 0),
          due_date: row.due_date ? new Date(row.due_date).toLocaleDateString('en-GB') : '',
          created_at: new Date(row.created_at).toLocaleDateString('en-GB'),
        })),
      }}
    >
      <DataTable
        columns={columns}
        data={data}
        getRowId={(row) => row.id}
        selectable
        onSelectionChange={setSelectedIds}
        stickyHeader
        maxHeight="600px"
        emptyState={
          <EmptyState
            icon={<Banknote className="h-12 w-12" />}
            title={t['noCommissions']}
          />
        }
      />
    </AdminTableShell>
  );
}
