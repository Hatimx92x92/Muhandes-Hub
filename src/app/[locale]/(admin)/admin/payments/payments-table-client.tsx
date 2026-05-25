'use client';

import { useMemo } from 'react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { AdminTableShell, type FilterGroup } from '@/components/features/admin/admin-table-shell';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { PaymentActionButtons } from '@/components/features/admin/payment-action-buttons';
import { Wallet, FileImage } from 'lucide-react';
import { formatSAR } from '@/lib/utils';
import { LocaleDate } from '@/components/ui/locale-date';
import { getProxyUrl } from '@/lib/file-utils';
import { useRouter } from '@/i18n/navigation';
import type { AdminPaymentRow } from '@/actions/admin/queries';

// =============================================================================
// Admin Payments Table Client
// =============================================================================

const TIER_BADGE: Record<string, string> = {
  starter: 'starter',
  pro: 'pro',
  business: 'business',
  enterprise: 'enterprise',
};

interface PaymentsTableClientProps {
  data: AdminPaymentRow[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  translations: Record<string, string>;
}

export function PaymentsTableClient({ data, totalCount, currentPage, totalPages, translations: t }: PaymentsTableClientProps) {
  const router = useRouter();

  const columns: ColumnDef<AdminPaymentRow>[] = useMemo(
    () => [
      {
        id: 'user',
        header: t['col_user'],
        cell: (row) => (
          <button
            className="text-sm font-medium text-primary hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/users/${row.user_id}` as '/admin/users/[id]');
            }}
          >
            {row.user_name ?? row.user_id.slice(0, 8)}
          </button>
        ),
      },
      {
        id: 'tier',
        header: t['col_tier'],
        cell: (row) => (
          <Badge variant={(TIER_BADGE[row.tier] ?? 'secondary') as 'starter' | 'pro' | 'business' | 'enterprise' | 'secondary'}>
            {t[`tier_${row.tier}`] ?? row.tier}
          </Badge>
        ),
      },
      {
        id: 'price',
        header: t['col_price'],
        sortKey: 'final_price',
        cell: (row) => (
          <span className="font-medium">{formatSAR(Number(row.final_price ?? 0))}</span>
        ),
      },
      {
        id: 'paymentMethod',
        header: t['col_paymentMethod'],
        cell: (row) => (
          <Badge variant="outline">
            {row.payment_method ? (t[`pm_${row.payment_method}`] ?? row.payment_method) : '—'}
          </Badge>
        ),
      },
      {
        id: 'status',
        header: t['col_status'],
        cell: (row) => {
          const ps = row.payment_status;
          return (
            <Badge variant={ps === 'completed' ? 'success' : ps === 'failed' ? 'destructive' : 'pending'}>
              {t[`status_${ps}`] ?? ps ?? '—'}
            </Badge>
          );
        },
      },
      {
        id: 'receipt',
        header: t['col_receipt'] || 'Receipt',
        hiddenOnMobile: true,
        cell: (row) => {
          if (!row.bank_receipt_url) return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <a
              href={getProxyUrl(row.bank_receipt_url)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <FileImage className="h-3.5 w-3.5" />
              {t['viewReceipt'] || 'View'}
            </a>
          );
        },
      },
      {
        id: 'date',
        header: t['col_date'],
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
            <PaymentActionButtons
              subscriptionId={row.id}
              paymentStatus={row.payment_status}
            />
          </div>
        ),
      },
    ],
    [t, router],
  );

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'status',
        label: t['col_status'],
        options: [
          { value: 'pending', label: t['status_pending'] },
          { value: 'completed', label: t['status_completed'] },
          { value: 'failed', label: t['status_failed'] },
        ],
      },
      {
        key: 'method',
        label: t['col_paymentMethod'],
        options: [
          { value: 'bank_transfer', label: t['pm_bank_transfer'] },
          { value: 'card', label: t['pm_card'] },
        ],
      },
    ],
    [t],
  );

  const sortOptions = useMemo(
    () => [
      { value: 'created_at:desc', label: t['sort_newest'] },
      { value: 'created_at:asc', label: t['sort_oldest'] },
      { value: 'final_price:desc', label: t['sort_amountHigh'] },
      { value: 'final_price:asc', label: t['sort_amountLow'] },
    ],
    [t],
  );

  return (
    <AdminTableShell
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      filterGroups={filterGroups}
      sortOptions={sortOptions}
      searchable
      searchPlaceholder={t['searchPlaceholder']}
      exportConfig={{
        filename: `admin-payments-${new Date().toISOString().slice(0, 10)}`,
        headers: [
          { key: 'user_name', label: t['col_user'] },
          { key: 'tier', label: t['col_tier'] },
          { key: 'final_price', label: t['col_price'] },
          { key: 'payment_method', label: t['col_paymentMethod'] },
          { key: 'payment_status', label: t['col_status'] },
          { key: 'created_at', label: t['col_date'] },
        ],
        data: data.map((row) => ({
          user_name: row.user_name ?? row.user_id.slice(0, 8),
          tier: t[`tier_${row.tier}`] ?? row.tier,
          final_price: Number(row.final_price ?? 0),
          payment_method: row.payment_method ? (t[`pm_${row.payment_method}`] ?? row.payment_method) : '—',
          payment_status: t[`status_${row.payment_status}`] ?? row.payment_status ?? '—',
          created_at: new Date(row.created_at).toLocaleDateString('en-GB'),
        })),
      }}
    >
      <DataTable
        columns={columns}
        data={data}
        getRowId={(row) => row.id}
        stickyHeader
        maxHeight="600px"
        emptyState={
          <EmptyState
            icon={<Wallet className="h-12 w-12" />}
            title={t['noPayments']}
          />
        }
      />
    </AdminTableShell>
  );
}
