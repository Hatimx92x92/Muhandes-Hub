'use client';

import { useMemo } from 'react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { AdminTableShell, type FilterGroup } from '@/components/features/admin/admin-table-shell';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { ClipboardList } from 'lucide-react';
import type { AdminAuditLogRow } from '@/actions/admin/queries';

// =============================================================================
// Admin Audit Log Table Client
// =============================================================================

const ACTION_BADGE: Record<string, string> = {
  approve_post: 'success',
  reject_post: 'destructive',
  approve_documents: 'success',
  reject_documents: 'destructive',
  ban_user: 'destructive',
  unban_user: 'success',
  restrict_user: 'warning',
  unrestrict_user: 'success',
  approve_commission_payment: 'success',
  resolve_commission_dispute: 'info',
  hide_review: 'warning',
  unhide_review: 'success',
  update_setting: 'secondary',
  create_coupon: 'info',
  update_coupon: 'info',
  toggle_coupon: 'info',
};

const AUDIT_ACTIONS = [
  'approve_post',
  'reject_post',
  'approve_documents',
  'reject_documents',
  'ban_user',
  'unban_user',
  'restrict_user',
  'unrestrict_user',
  'approve_commission_payment',
  'resolve_commission_dispute',
  'update_setting',
  'create_coupon',
  'update_coupon',
  'toggle_coupon',
  'hide_review',
  'unhide_review',
] as const;

const TARGET_TYPES = [
  'project',
  'product',
  'rfq',
  'user',
  'commission',
  'review',
  'coupon',
  'platform_settings',
] as const;

type BadgeVariant = 'success' | 'destructive' | 'warning' | 'info' | 'secondary';

interface AuditLogTableClientProps {
  data: AdminAuditLogRow[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  translations: Record<string, string>;
}

export function AuditLogTableClient({ data, totalCount, currentPage, totalPages, translations: t }: AuditLogTableClientProps) {
  const columns: ColumnDef<AdminAuditLogRow>[] = useMemo(
    () => [
      {
        id: 'action',
        header: t['col_action'],
        cell: (row) => (
          <Badge variant={(ACTION_BADGE[row.action] ?? 'secondary') as BadgeVariant}>
            {t[`auditAction_${row.action}`] ?? row.action}
          </Badge>
        ),
      },
      {
        id: 'targetType',
        header: t['col_targetType'],
        cell: (row) => (
          <Badge variant="outline">
            {t[`targetType_${row.target_type}`] ?? row.target_type}
          </Badge>
        ),
      },
      {
        id: 'targetId',
        header: t['col_targetId'],
        hiddenOnMobile: true,
        cell: (row) => (
          <span className="font-mono text-xs">{row.target_id?.slice(0, 8) ?? '—'}</span>
        ),
      },
      {
        id: 'adminId',
        header: t['col_adminId'],
        hiddenOnMobile: true,
        cell: (row) => (
          <span className="font-mono text-xs">{row.admin_id?.slice(0, 8) ?? '—'}</span>
        ),
      },
      {
        id: 'ip',
        header: t['col_ip'],
        hiddenOnMobile: true,
        cell: (row) => (
          <span className="text-xs text-muted-foreground">{row.ip_address ?? '—'}</span>
        ),
      },
      {
        id: 'details',
        header: t['col_details'],
        hiddenOnMobile: true,
        cell: (row) => {
          if (!row.details || Object.keys(row.details as Record<string, unknown>).length === 0) return <span>—</span>;
          return (
            <span className="max-w-50 truncate text-xs text-muted-foreground" title={JSON.stringify(row.details)}>
              {JSON.stringify(row.details).slice(0, 60)}
            </span>
          );
        },
      },
      {
        id: 'timestamp',
        header: t['col_timestamp'],
        sortKey: 'created_at',
        cell: (row) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.created_at).toLocaleString()}
          </span>
        ),
      },
    ],
    [t],
  );

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'action',
        label: t['col_action'],
        options: AUDIT_ACTIONS.map((a) => ({
          value: a,
          label: t[`auditAction_${a}`] ?? a,
        })),
      },
      {
        key: 'target_type',
        label: t['col_targetType'],
        options: TARGET_TYPES.map((tt) => ({
          value: tt,
          label: t[`targetType_${tt}`] ?? tt,
        })),
      },
    ],
    [t],
  );

  const sortOptions = useMemo(
    () => [
      { value: 'created_at:desc', label: t['sort_newest'] },
      { value: 'created_at:asc', label: t['sort_oldest'] },
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
      exportConfig={{
        filename: `admin-audit-log-${new Date().toISOString().slice(0, 10)}`,
        headers: [
          { key: 'action', label: t['col_action'] },
          { key: 'target_type', label: t['col_targetType'] },
          { key: 'target_id', label: t['col_targetId'] },
          { key: 'admin_id', label: t['col_adminId'] },
          { key: 'ip_address', label: t['col_ip'] },
          { key: 'created_at', label: t['col_timestamp'] },
        ],
        data: data.map((row) => ({
          action: t[`auditAction_${row.action}`] ?? row.action,
          target_type: t[`targetType_${row.target_type}`] ?? row.target_type,
          target_id: row.target_id?.slice(0, 8) ?? '',
          admin_id: row.admin_id?.slice(0, 8) ?? '',
          ip_address: row.ip_address ?? '',
          created_at: new Date(row.created_at).toLocaleString(),
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
            icon={<ClipboardList className="h-12 w-12" />}
            title={t['noAuditLogs']}
          />
        }
      />
    </AdminTableShell>
  );
}
