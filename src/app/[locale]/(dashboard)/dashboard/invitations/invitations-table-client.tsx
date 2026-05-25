'use client';

import { useMemo } from 'react';
import { useRealtime } from '@/hooks';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { DashboardTableShell, type FilterGroup } from '@/components/features/dashboard-table-shell';
import { getStatusVariant } from '@/components/features/status-badge-map';
import { formatDate } from '@/lib/utils';
import { Send } from 'lucide-react';

// =============================================================================
// Invitations Table Client — PO Sent Invitations
// =============================================================================

export interface SentInvitationRow {
  id: string;
  type: 'bid' | 'quote';
  project_title: string;
  recipient_name: string;
  created_at: string;
  status: string;
}

interface InvitationsTableClientProps {
  items: SentInvitationRow[];
  locale: string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filterGroups: FilterGroup[];
  sortOptions: { value: string; label: string }[];
  translations: Record<string, string>;
}

export function InvitationsTableClient({
  items,
  locale,
  totalCount,
  currentPage,
  totalPages,
  filterGroups,
  sortOptions,
  translations: t,
}: InvitationsTableClientProps) {
  // Live updates when invitations change
  useRealtime({ channel: 'rt-bids-inv', table: 'bids', event: 'INSERT' });

  const columns: ColumnDef<SentInvitationRow>[] = useMemo(
    () => [
      {
        id: 'type',
        header: t.colType,
        cell: (row) => (
          <Badge variant="outline">
            {row.type === 'bid' ? t.typeBid : t.typeQuote}
          </Badge>
        ),
      },
      {
        id: 'project',
        header: t.colProject,
        cell: (row) => (
          <p className="truncate font-medium text-foreground max-w-[200px]">
            {row.project_title}
          </p>
        ),
      },
      {
        id: 'recipient',
        header: t.colRecipient,
        cell: (row) => (
          <span className="text-sm text-foreground">{row.recipient_name}</span>
        ),
      },
      {
        id: 'date',
        header: t.colDate,
        cell: (row) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.created_at, locale)}
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
            icon={<Send className="h-12 w-12" />}
            title={t.noSentInvitations}
            description={t.noSentInvitationsDesc}
          />
        }
      />
    </DashboardTableShell>
  );
}
