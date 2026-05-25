'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { useRealtime } from '@/hooks';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { BulkActionBar, type BulkAction } from '@/components/features/bulk-action-bar';
import { DashboardTableShell, type FilterGroup } from '@/components/features/dashboard-table-shell';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { markNotificationRead } from '@/actions/notifications';
import { formatRelativeTime } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

export interface NotificationRow {
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationsTableClientProps {
  items: NotificationRow[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filterGroups: FilterGroup[];
  sortOptions: { value: string; label: string }[];
  translations: Record<string, string>;
  onBulkMarkRead?: (ids: string[]) => Promise<void>;
  onBulkDelete?: (ids: string[]) => Promise<void>;
}

// =============================================================================
// Component
// =============================================================================

export function NotificationsTableClient({
  items,
  totalCount,
  currentPage,
  totalPages,
  filterGroups,
  sortOptions,
  translations: t,
  onBulkMarkRead,
  onBulkDelete,
}: NotificationsTableClientProps) {
  const router = useRouter();
  const locale = useLocale();

  // Live updates when notifications change
  useRealtime({ channel: 'rt-notifications', table: 'notifications' });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const columns: ColumnDef<NotificationRow>[] = useMemo(
    () => [
      {
        id: 'read',
        header: '',
        cell: (row) => (
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              row.is_read ? 'bg-transparent' : 'bg-primary'
            }`}
          />
        ),
      },
      {
        id: 'type',
        header: t.type || 'Type',
        cell: (row) => (
          <Badge variant="outline" className="text-xs">
            {row.typeLabel}
          </Badge>
        ),
        hiddenOnMobile: true,
      },
      {
        id: 'title',
        header: t.message || 'Message',
        cell: (row) => (
          <div className="min-w-0">
            <p className={`text-sm ${row.is_read ? 'text-muted-foreground' : 'font-medium text-foreground'}`}>
              {row.title}
            </p>
            {row.body && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {row.body}
              </p>
            )}
          </div>
        ),
      },
      {
        id: 'created',
        header: t.time || 'Time',
        cell: (row) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(row.created_at, locale)}
          </span>
        ),
        hiddenOnMobile: true,
      },
    ],
    [t],
  );

  const bulkActions: BulkAction[] = useMemo(() => {
    const actions: BulkAction[] = [];
    if (onBulkMarkRead) {
      actions.push({
        id: 'markRead',
        label: t.markRead || 'Mark Read',
        icon: <CheckCheck className="h-4 w-4" />,
        variant: 'secondary',
        onClick: (ids: string[]) => {
          startTransition(async () => {
            await onBulkMarkRead(ids);
            setSelectedIds([]);
          });
        },
      });
    }
    if (onBulkDelete) {
      actions.push({
        id: 'delete',
        label: t.delete || 'Delete',
        icon: <Trash2 className="h-4 w-4" />,
        variant: 'destructive',
        onClick: (ids: string[]) => {
          startTransition(async () => {
            await onBulkDelete(ids);
            setSelectedIds([]);
          });
        },
      });
    }
    return actions;
  }, [onBulkMarkRead, onBulkDelete, t, startTransition]);

  return (
    <DashboardTableShell
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      filterGroups={filterGroups}
      sortOptions={sortOptions}
      searchable
      selectedIds={selectedIds}
      selectedCount={selectedIds.length}
      bulkActions={bulkActions}
      onSelectionClear={() => setSelectedIds([])}
    >
      <div className={isPending ? 'opacity-60 pointer-events-none' : ''}>
        <DataTable
          columns={columns}
          data={items}
          getRowId={(row) => row.id}
          selectable
          onSelectionChange={setSelectedIds}
          onRowClick={(row) => {
            if (!row.is_read) {
              startTransition(async () => {
                await markNotificationRead(row.id);
              });
            }
            if (row.link) router.push(row.link);
          }}
          emptyState={
            <EmptyState
              icon={<Bell className="h-12 w-12" />}
              title={t.noNotifications || 'No notifications'}
              description={t.noNotificationsDesc || ''}
            />
          }
        />
      </div>
    </DashboardTableShell>
  );
}
