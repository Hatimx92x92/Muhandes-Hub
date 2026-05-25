'use client';

import { useMemo } from 'react';
import { useRealtime } from '@/hooks';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/features/empty-state';
import { DashboardTableShell, type FilterGroup } from '@/components/features/dashboard-table-shell';
import { getStatusVariant } from '@/components/features/status-badge-map';
import { formatSAR, formatDate } from '@/lib/utils';
import { CommissionActions } from '@/components/features/commissions/commission-actions';
import { Banknote, Download } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface CommissionRow {
  id: string;
  deal_id: string;
  deal_title: string;
  rate: number;
  deal_value: number;
  amount: number;
  vat_amount: number;
  total: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  dispute_reason: string | null;
  created_at: string;
  is_overdue: boolean;
  can_pay: boolean;
  can_dispute: boolean;
}

// =============================================================================
// Component
// =============================================================================

interface CommissionsTableClientProps {
  items: CommissionRow[];
  locale: string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filterGroups: FilterGroup[];
  sortOptions: { value: string; label: string }[];
  translations: Record<string, string>;
}

export function CommissionsTableClient({
  items,
  locale,
  totalCount,
  currentPage,
  totalPages,
  filterGroups,
  sortOptions,
  translations: t,
}: CommissionsTableClientProps) {
  // Live updates when commissions change
  useRealtime({ channel: 'rt-commissions', table: 'commissions' });

  const columns: ColumnDef<CommissionRow>[] = useMemo(
    () => [
      {
        id: 'deal',
        header: t.colDeal,
        cell: (row) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground max-w-[180px]">
              {row.deal_title}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.commissionRate} {row.rate}%
            </p>
          </div>
        ),
      },
      {
        id: 'status',
        header: t.colStatus,
        cell: (row) => (
          <Badge variant={getStatusVariant(row.status)}>
            {t[`status_${row.status}`] ?? row.status}
          </Badge>
        ),
      },
      {
        id: 'dealValue',
        header: t.colDealValue,
        cell: (row) => (
          <span className="text-sm text-foreground">
            {formatSAR(row.deal_value, locale)}
          </span>
        ),
        hiddenOnMobile: true,
      },
      {
        id: 'total',
        header: t.colTotal,
        cell: (row) => (
          <span className="text-sm font-semibold text-primary">
            {formatSAR(row.total, locale)}
          </span>
        ),
      },
      {
        id: 'dueDate',
        header: t.colDueDate,
        cell: (row) =>
          row.due_date ? (
            <span className={`text-xs ${row.is_overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
              {row.is_overdue && '⚠ '}
              {formatDate(row.due_date, locale)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
        hiddenOnMobile: true,
      },
      {
        id: 'actions',
        header: '',
        cell: (row) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <a href={`/api/pdf/invoice/${row.id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" title={t.downloadInvoice}>
                <Download className="h-4 w-4" />
              </Button>
            </a>
            {(row.can_pay || row.can_dispute) && (
              <CommissionActions
                commissionId={row.id}
                canPay={row.can_pay}
                canDispute={row.can_dispute}
              />
            )}
          </div>
        ),
      },
    ],
    [t, locale],
  );

  return (
    <DashboardTableShell
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      filterGroups={filterGroups}
      sortOptions={sortOptions}
    >
      <DataTable
        columns={columns}
        data={items}
        getRowId={(row) => row.id}
        emptyState={
          <EmptyState
            icon={<Banknote className="h-12 w-12" />}
            title={t.noCommissions}
            description={t.noCommissionsDesc}
            actionLabel={t.viewDeals}
            actionHref="/dashboard/deals"
          />
        }
      />
    </DashboardTableShell>
  );
}
