'use client';

import { useMemo, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useRealtime } from '@/hooks';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { DashboardTableShell, type FilterGroup } from '@/components/features/dashboard-table-shell';
import { getStatusVariant } from '@/components/features/status-badge-map';
import { formatSAR, formatDate } from '@/lib/utils';
import { ShoppingCart, MessageSquare } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface RFQRow {
  id: string;
  title: string;
  status: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  response_count: number;
  created_at: string;
  slug: string;
}

export interface ResponseRow {
  id: string;
  rfq_id: string;
  status: string;
  created_at: string;
}

// =============================================================================
// RFQs Table
// =============================================================================

interface RFQsTableClientProps {
  items: RFQRow[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filterGroups: FilterGroup[];
  sortOptions: { value: string; label: string }[];
  translations: Record<string, string>;
}

export function RFQsTableClient({
  items,
  totalCount,
  currentPage,
  totalPages,
  filterGroups,
  sortOptions,
  translations: t,
}: RFQsTableClientProps) {
  const router = useRouter();

  // Live updates when RFQs change
  useRealtime({ channel: 'rt-rfqs', table: 'rfqs' });

  const columns: ColumnDef<RFQRow>[] = useMemo(
    () => [
      {
        id: 'title',
        header: t.colTitle,
        cell: (row) => (
          <p className="truncate font-medium text-foreground max-w-[250px]">
            {row.title}
          </p>
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
        id: 'budget',
        header: t.colBudget,
        cell: (row) =>
          row.budget_max ? (
            <span className="text-sm text-foreground">
              {t.upTo} {formatSAR(row.budget_max)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
        hiddenOnMobile: true,
      },
      {
        id: 'deadline',
        header: t.colDeadline,
        cell: (row) =>
          row.deadline ? (
            <span className="text-xs text-muted-foreground">
              {formatDate(row.deadline)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
        hiddenOnMobile: true,
      },
      {
        id: 'responses',
        header: t.colResponses,
        cell: (row) => (
          <span className="text-xs text-muted-foreground">
            {row.response_count}
          </span>
        ),
        hiddenOnMobile: true,
      },
      {
        id: 'created',
        header: t.colCreated,
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

  const handleRowClick = useCallback(
    (row: RFQRow) => {
      router.push(`/dashboard/rfqs/${row.slug}`);
    },
    [router],
  );

  return (
    <DashboardTableShell
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      filterGroups={filterGroups}
      sortOptions={sortOptions}
      searchable
      preserveParams={['tab']}
    >
      <DataTable
        columns={columns}
        data={items}
        getRowId={(row) => row.id}
        onRowClick={handleRowClick}
        emptyState={
          <EmptyState
            icon={<ShoppingCart className="h-12 w-12" />}
            title={t.noRfqs}
            description={t.noRfqsDesc}
          />
        }
      />
    </DashboardTableShell>
  );
}

// =============================================================================
// Responses Table
// =============================================================================

interface ResponsesTableClientProps {
  items: ResponseRow[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  sortOptions: { value: string; label: string }[];
  translations: Record<string, string>;
}

export function ResponsesTableClient({
  items,
  totalCount,
  currentPage,
  totalPages,
  sortOptions,
  translations: t,
}: ResponsesTableClientProps) {
  const router = useRouter();

  const columns: ColumnDef<ResponseRow>[] = useMemo(
    () => [
      {
        id: 'rfq',
        header: t.colRfq,
        cell: (row) => (
          <span className="text-sm font-medium text-foreground">
            {t.responseToRfq} #{row.rfq_id.slice(0, 8)}
          </span>
        ),
      },
      {
        id: 'status',
        header: t.colStatus,
        cell: (row) => (
          <Badge variant={getStatusVariant(row.status)}>
            {t[`responseStatus_${row.status}`] ?? row.status}
          </Badge>
        ),
      },
      {
        id: 'created',
        header: t.colCreated,
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

  const handleRowClick = useCallback(
    (row: ResponseRow) => {
      router.push(`/dashboard/rfqs/${row.rfq_id}`);
    },
    [router],
  );

  return (
    <DashboardTableShell
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      sortOptions={sortOptions}
      preserveParams={['tab']}
    >
      <DataTable
        columns={columns}
        data={items}
        getRowId={(row) => row.id}
        onRowClick={handleRowClick}
        emptyState={
          <EmptyState
            icon={<MessageSquare className="h-12 w-12" />}
            title={t.noResponses}
            description={t.noResponsesDesc}
          />
        }
      />
    </DashboardTableShell>
  );
}
