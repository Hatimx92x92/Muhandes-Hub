'use client';

import { useState, useMemo, useCallback, useTransition } from 'react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { AdminTableShell, type FilterGroup } from '@/components/features/admin/admin-table-shell';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { AdminUserActions } from '@/components/features/admin/user-actions';
import { useRouter } from '@/i18n/navigation';
import { Users, Shield, ShieldBan, ShieldAlert, CheckCircle } from 'lucide-react';
import type { AdminUserRow } from '@/actions/admin/queries';
import type { BulkAction } from '@/components/features/bulk-action-bar';
import { bulkUserAction } from '@/actions/admin/users';

// =============================================================================
// Admin Users Table Client
// =============================================================================

const STATUS_VARIANTS: Record<string, BadgeProps['variant']> = {
  pending_email: 'pending',
  pending_payment: 'pending',
  pending_documents: 'pending',
  pending_approval: 'warning',
  active: 'success',
  banned: 'destructive',
  restricted: 'warning',
};

interface UsersTableClientProps {
  data: AdminUserRow[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  translations: Record<string, string>;
}

export function UsersTableClient({ data, totalCount, currentPage, totalPages, translations: t }: UsersTableClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  const columns: ColumnDef<AdminUserRow>[] = useMemo(
    () => [
      {
        id: 'name',
        header: t['col_name'],
        sortKey: 'full_name',
        cell: (row) => (
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-medium text-foreground">
                {row.full_name ?? t['noName']}
              </p>
              {row.is_admin && (
                <Badge variant="info" className="shrink-0">
                  <Shield className="me-1 h-3 w-3" />
                  {t['adminBadge']}
                </Badge>
              )}
            </div>
          </div>
        ),
      },
      {
        id: 'company',
        header: t['col_company'],
        hiddenOnMobile: true,
        cell: (row) => (
          <span className="text-sm text-muted-foreground truncate">
            {row.company_name_ar ?? row.company_name_en ?? '—'}
          </span>
        ),
      },
      {
        id: 'role',
        header: t['col_role'],
        cell: (row) => (
          <Badge variant={row.role as BadgeProps['variant']}>
            {t[`role_${row.role}`] ?? row.role}
          </Badge>
        ),
      },
      {
        id: 'status',
        header: t['col_status'],
        sortKey: 'verification_status',
        cell: (row) => (
          <Badge variant={STATUS_VARIANTS[row.verification_status] ?? 'secondary'}>
            {t[`status_${row.verification_status}`] ?? row.verification_status}
          </Badge>
        ),
      },
      {
        id: 'created',
        header: t['col_created'],
        sortKey: 'created_at',
        hiddenOnMobile: true,
        cell: (row) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.created_at).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: t['col_actions'],
        cell: (row) => (
          <div onClick={(e) => e.stopPropagation()}>
            <AdminUserActions
              userId={row.id}
              currentStatus={row.verification_status}
              isAdmin={row.is_admin}
            />
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
          { value: 'active', label: t['status_active'] },
          { value: 'pending_approval', label: t['status_pending_approval'] },
          { value: 'pending_documents', label: t['status_pending_documents'] },
          { value: 'pending_payment', label: t['status_pending_payment'] },
          { value: 'pending_email', label: t['status_pending_email'] },
          { value: 'banned', label: t['status_banned'] },
          { value: 'restricted', label: t['status_restricted'] },
        ],
      },
      {
        key: 'role',
        label: t['col_role'],
        options: [
          { value: 'project_owner', label: t['role_project_owner'] },
          { value: 'contractor', label: t['role_contractor'] },
          { value: 'supplier', label: t['role_supplier'] },
          { value: 'buyer', label: t['role_buyer'] },
        ],
      },
    ],
    [t],
  );

  const sortOptions = useMemo(
    () => [
      { value: 'created_at:desc', label: t['sort_newest'] },
      { value: 'created_at:asc', label: t['sort_oldest'] },
      { value: 'full_name:asc', label: t['sort_nameAsc'] },
      { value: 'full_name:desc', label: t['sort_nameDesc'] },
    ],
    [t],
  );

  const handleRowClick = useCallback(
    (row: AdminUserRow) => {
      router.push(`/admin/users/${row.id}`);
    },
    [router],
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
            await bulkUserAction(ids, 'approve');
            setSelectedIds([]);
          });
        },
      },
      {
        id: 'restrict',
        label: t['action_restrict'],
        icon: <ShieldAlert className="h-4 w-4" />,
        variant: 'secondary' as const,
        onClick: (ids: string[]) => {
          startTransition(async () => {
            await bulkUserAction(ids, 'restrict');
            setSelectedIds([]);
          });
        },
      },
      {
        id: 'ban',
        label: t['action_ban'],
        icon: <ShieldBan className="h-4 w-4" />,
        variant: 'destructive' as const,
        onClick: (ids: string[]) => {
          startTransition(async () => {
            await bulkUserAction(ids, 'ban');
            setSelectedIds([]);
          });
        },
      },
    ],
    [t],
  );

  return (
    <AdminTableShell
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      filterGroups={filterGroups}
      searchable
      searchPlaceholder={t['searchPlaceholder']}
      sortOptions={sortOptions}
      selectedIds={selectedIds}
      selectedCount={selectedIds.length}
      bulkActions={bulkActions}
      onSelectionClear={() => setSelectedIds([])}
      exportConfig={{
        filename: `admin-users-${new Date().toISOString().slice(0, 10)}`,
        headers: [
          { key: 'full_name', label: t['col_name'] },
          { key: 'company', label: t['col_company'] },
          { key: 'role', label: t['col_role'] },
          { key: 'verification_status', label: t['col_status'] },
          { key: 'created_at', label: t['col_created'] },
        ],
        data: data.map((row) => ({
          full_name: row.full_name ?? '',
          company: row.company_name_ar ?? row.company_name_en ?? '',
          role: t[`role_${row.role}`] ?? row.role,
          verification_status: t[`status_${row.verification_status}`] ?? row.verification_status,
          created_at: new Date(row.created_at).toLocaleDateString(),
        })),
      }}
    >
      <DataTable
        columns={columns}
        data={data}
        getRowId={(row) => row.id}
        onRowClick={handleRowClick}
        selectable
        onSelectionChange={setSelectedIds}
        stickyHeader
        maxHeight="600px"
        emptyState={
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title={t['noUsers']}
            description={t['noUsersDesc']}
          />
        }
      />
    </AdminTableShell>
  );
}
