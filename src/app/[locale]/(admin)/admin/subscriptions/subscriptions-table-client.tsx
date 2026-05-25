'use client';

import { useState, useMemo } from 'react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { AdminTableShell, type FilterGroup } from '@/components/features/admin/admin-table-shell';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { SubscriptionManagerButton } from '@/components/features/admin/subscription-manager';
import { SubscriptionDetailModal } from '@/components/features/admin/subscription-detail-modal';
import { CreditCard, FileImage } from 'lucide-react';
import { LocaleDate } from '@/components/ui/locale-date';
import { formatSAR } from '@/lib/utils';
import { getProxyUrl } from '@/lib/file-utils';
import { useRouter } from '@/i18n/navigation';
import type { AdminSubscriptionRow } from '@/actions/admin/queries';

// =============================================================================
// Admin Subscriptions Table Client
// =============================================================================

const TIER_BADGE: Record<string, string> = {
  starter: 'starter',
  pro: 'pro',
  business: 'business',
  enterprise: 'enterprise',
};

interface SubscriptionsTableClientProps {
  data: AdminSubscriptionRow[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  translations: Record<string, string>;
}

export function SubscriptionsTableClient({ data, totalCount, currentPage, totalPages, translations: t }: SubscriptionsTableClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const router = useRouter();

  const columns: ColumnDef<AdminSubscriptionRow>[] = useMemo(
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
        sortKey: 'tier',
        cell: (row) => (
          <Badge variant={(TIER_BADGE[row.tier] ?? 'secondary') as 'starter' | 'pro' | 'business' | 'enterprise' | 'secondary'}>
            {t[`tier_${row.tier}`] ?? row.tier}
          </Badge>
        ),
      },
      {
        id: 'status',
        header: t['col_status'],
        cell: (row) => {
          if (row.payment_status === 'pending') {
            return (
              <Badge variant="warning">
                {t['subStatus_pending'] ?? 'Pending Payment'}
              </Badge>
            );
          }
          const status = row.is_active ? 'active' : 'expired';
          return (
            <Badge variant={row.is_active ? 'success' : 'destructive'}>
              {t[`subStatus_${status}`] ?? status}
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
        id: 'price',
        header: t['col_price'],
        sortKey: 'final_price',
        hiddenOnMobile: true,
        cell: (row) => (
          <span className="font-medium">{formatSAR(Number(row.final_price ?? 0))}</span>
        ),
      },
      {
        id: 'paymentMethod',
        header: t['col_paymentMethod'] ?? 'Payment',
        hiddenOnMobile: true,
        cell: (row) => (
          <span className="text-xs">
            {row.payment_method ? (t[`pm_${row.payment_method}`] ?? row.payment_method) : '—'}
          </span>
        ),
      },
      {
        id: 'startDate',
        header: t['col_startDate'],
        sortKey: 'created_at',
        hiddenOnMobile: true,
        cell: (row) => (
          <LocaleDate date={row.created_at} className="text-xs text-muted-foreground" />
        ),
      },
      {
        id: 'expiresDate',
        header: t['col_expiresDate'],
        sortKey: 'expires_at',
        hiddenOnMobile: true,
        cell: (row) => (
          <LocaleDate date={row.expires_at} className="text-xs text-muted-foreground" />
        ),
      },
      {
        id: 'actions',
        header: t['col_actions'],
        cell: (row) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <SubscriptionDetailModal subscription={row} translations={t} />
            <SubscriptionManagerButton
              userId={row.user_id}
              currentTier={row.tier}
              currentStatus={row.is_active ? 'active' : 'expired'}
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
        key: 'tier',
        label: t['col_tier'],
        options: [
          { value: 'starter', label: t['tier_starter'] },
          { value: 'pro', label: t['tier_pro'] },
          { value: 'business', label: t['tier_business'] },
          { value: 'enterprise', label: t['tier_enterprise'] },
        ],
      },
      {
        key: 'status',
        label: t['col_status'],
        options: [
          { value: 'active', label: t['subStatus_active'] },
          { value: 'expired', label: t['subStatus_expired'] },
          { value: 'pending', label: t['subStatus_pending'] ?? 'Pending Payment' },
        ],
      },
    ],
    [t],
  );

  const sortOptions = useMemo(
    () => [
      { value: 'created_at:desc', label: t['sort_newest'] },
      { value: 'created_at:asc', label: t['sort_oldest'] },
      { value: 'expires_at:asc', label: t['sort_dueSoon'] },
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
        filename: `admin-subscriptions-${new Date().toISOString().slice(0, 10)}`,
        headers: [
          { key: 'user_name', label: t['col_user'] },
          { key: 'tier', label: t['col_tier'] },
          { key: 'status', label: t['col_status'] },
          { key: 'final_price', label: t['col_price'] },
          { key: 'created_at', label: t['col_startDate'] },
          { key: 'expires_at', label: t['col_expiresDate'] },
        ],
        data: data.map((row) => ({
          user_name: row.user_name ?? row.user_id.slice(0, 8),
          tier: t[`tier_${row.tier}`] ?? row.tier,
          status: row.is_active ? (t['subStatus_active'] ?? 'active') : (t['subStatus_expired'] ?? 'expired'),
          final_price: Number(row.final_price ?? 0),
          created_at: new Date(row.created_at).toLocaleDateString('en-GB'),
          expires_at: row.expires_at ? new Date(row.expires_at).toLocaleDateString('en-GB') : '',
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
            icon={<CreditCard className="h-12 w-12" />}
            title={t['noSubscriptions']}
          />
        }
      />
    </AdminTableShell>
  );
}
