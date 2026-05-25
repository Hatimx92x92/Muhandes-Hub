'use client';

import { useMemo, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { AdminTableShell, type FilterGroup } from '@/components/features/admin/admin-table-shell';
import { Badge } from '@/components/ui/badge';
import { getStatusVariant } from '@/components/features/status-badge-map';
import { formatSAR, formatDate } from '@/lib/utils';
import type { AdminBidRow } from '@/actions/admin/queries';

interface AdminBidsTableClientProps {
  data: AdminBidRow[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  locale: string;
  translations: Record<string, string>;
}

export function AdminBidsTableClient({
  data,
  totalCount,
  currentPage,
  totalPages,
  locale,
  translations: t,
}: AdminBidsTableClientProps) {
  const router = useRouter();

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'status',
        label: t.colStatus,
        options: [
          { value: 'pending', label: t.status_pending },
          { value: 'accepted', label: t.status_accepted },
          { value: 'rejected', label: t.status_rejected },
          { value: 'withdrawn', label: t.status_withdrawn },
        ],
      },
    ],
    [t],
  );

  const sortOptions = useMemo(
    () => [
      { value: 'created_at:desc', label: t.sort_newest },
      { value: 'created_at:asc', label: t.sort_oldest },
      { value: 'amount:desc', label: t.sort_amountHigh },
      { value: 'amount:asc', label: t.sort_amountLow },
    ],
    [t],
  );

  const columns: ColumnDef<AdminBidRow>[] = useMemo(
    () => [
      {
        id: 'contractor',
        header: t.colContractor,
        cell: (row) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{row.contractor_name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {row.contractor_company}
            </p>
          </div>
        ),
      },
      {
        id: 'project',
        header: t.colProject,
        cell: (row) => (
          <p className="truncate text-muted-foreground max-w-[200px]">
            {locale === 'ar' ? row.project_title_ar : (row.project_title_en || row.project_title_ar) || '—'}
          </p>
        ),
        hiddenOnMobile: true,
      },
      {
        id: 'amount',
        header: t.colAmount,
        cell: (row) => (
          <span className="font-medium">{formatSAR(row.amount)}</span>
        ),
      },
      {
        id: 'timeline',
        header: t.colTimeline,
        cell: (row) => (
          <span className="text-muted-foreground">
            {row.timeline_days} {t.days}
          </span>
        ),
        hiddenOnMobile: true,
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
    [t, locale],
  );

  const handleRowClick = useCallback(
    (row: AdminBidRow) => {
      router.push(`/admin/bids/${row.id}`);
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
      searchable={false}
    >
      <DataTable
        columns={columns}
        data={data}
        getRowId={(row) => row.id}
        onRowClick={handleRowClick}
        emptyState={
          <div className="p-8 text-center text-muted-foreground">
            {t.noBids}
          </div>
        }
      />
    </AdminTableShell>
  );
}
