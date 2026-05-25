'use client';

import { useMemo, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useRealtime } from '@/hooks';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { DashboardTableShell, type FilterGroup } from '@/components/features/dashboard-table-shell';
import { getStatusVariant } from '@/components/features/status-badge-map';
import { formatRelativeTime } from '@/lib/utils';
import { FileText, Inbox } from 'lucide-react';

// =============================================================================
// Contracts Table Client — Created / Received views
// =============================================================================

export interface ContractRow {
  id: string;
  status: string;
  template_type: string;
  party_a_name: string;
  party_b_name: string;
  created_at: string;
  signatures_count: number;
  deal_id: string | null;
  /** Only for received view */
  i_have_signed?: boolean;
  creator_company?: string;
}

interface ContractsTableClientProps {
  items: ContractRow[];
  activeView: 'created' | 'received';
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filterGroups: FilterGroup[];
  sortOptions: { value: string; label: string }[];
  translations: Record<string, string>;
}

export function ContractsTableClient({
  items,
  activeView,
  totalCount,
  currentPage,
  totalPages,
  filterGroups,
  sortOptions,
  translations: t,
}: ContractsTableClientProps) {
  const router = useRouter();

  // Live updates when contracts change
  useRealtime({ channel: 'rt-contracts', table: 'contracts' });

  const columns: ColumnDef<ContractRow>[] = useMemo(() => {
    const cols: ColumnDef<ContractRow>[] = [
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
        id: 'template',
        header: t.colTemplate,
        cell: (row) => (
          <Badge variant="outline">
            {t[`template_${row.template_type}`] ?? row.template_type}
          </Badge>
        ),
        hiddenOnMobile: true,
      },
      {
        id: 'parties',
        header: t.colParties,
        cell: (row) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {row.party_a_name || t.partyA}
              {' ↔ '}
              {row.party_b_name || t.partyB}
            </p>
            {activeView === 'received' && row.creator_company && (
              <p className="text-xs text-muted-foreground">
                {t.creatorName}: {row.creator_company}
              </p>
            )}
          </div>
        ),
      },
      {
        id: 'created',
        header: t.colCreated,
        cell: (row) => (
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(row.created_at)}
          </span>
        ),
        hiddenOnMobile: true,
      },
      {
        id: 'signatures',
        header: t.colSignatures,
        cell: (row) => (
          <span className="text-xs text-muted-foreground">
            {row.signatures_count}/2
          </span>
        ),
        hiddenOnMobile: true,
      },
    ];

    // Add "Your Signature" column for received view
    if (activeView === 'received') {
      cols.push({
        id: 'yourSignature',
        header: t.colYourSignature,
        cell: (row) => (
          <Badge variant={row.i_have_signed ? 'success' : 'pending'}>
            {row.i_have_signed ? t.alreadySigned : t.awaitingSignature}
          </Badge>
        ),
      });
    }

    // Add deal indicator column
    cols.push({
      id: 'deal',
      header: t.colDeal,
      cell: (row) =>
        row.deal_id ? (
          <Badge variant="info" className="text-xs">
            {t.linkedToDeal}
          </Badge>
        ) : null,
      hiddenOnMobile: true,
    });

    return cols;
  }, [t, activeView]);

  const handleRowClick = useCallback(
    (row: ContractRow) => {
      router.push(`/dashboard/contracts/${row.id}`);
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
      preserveParams={['view']}
    >
      <DataTable
        columns={columns}
        data={items}
        getRowId={(row) => row.id}
        onRowClick={handleRowClick}
        emptyState={
          <EmptyState
            icon={activeView === 'created' ? <FileText className="h-12 w-12" /> : <Inbox className="h-12 w-12" />}
            title={activeView === 'created' ? t.noContracts : t.noReceivedContracts}
            description={activeView === 'created' ? t.noContractsDesc : t.noReceivedContractsDesc}
            actionLabel={activeView === 'created' ? t.createNewContract : undefined}
            actionHref={activeView === 'created' ? '/dashboard/contracts/new' : undefined}
          />
        }
      />
    </DashboardTableShell>
  );
}
