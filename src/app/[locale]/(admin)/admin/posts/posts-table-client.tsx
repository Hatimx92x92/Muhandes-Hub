'use client';

import { useState, useMemo, useCallback, useTransition } from 'react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { AdminTableShell, type FilterGroup } from '@/components/features/admin/admin-table-shell';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { AdminPostActions } from '@/components/features/admin/post-actions';
import { FileText, Pencil, CheckCircle, XCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { AdminPostRow } from '@/actions/admin/queries';
import type { BulkAction } from '@/components/features/bulk-action-bar';
import { approvePost, rejectPost } from '@/actions/admin/moderation';

// =============================================================================
// Admin Posts Table Client
// =============================================================================

interface PostsTableClientProps {
  data: AdminPostRow[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  translations: Record<string, string>;
}

export function PostsTableClient({ data, totalCount, currentPage, totalPages, translations: t }: PostsTableClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  const columns: ColumnDef<AdminPostRow>[] = useMemo(
    () => [
      {
        id: 'title',
        header: t['col_title'],
        cell: (row) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {row.title_ar || row.title_en || t['noTitle']}
            </p>
            {row.title_en && row.title_ar && (
              <p className="truncate text-xs text-muted-foreground">{row.title_en}</p>
            )}
          </div>
        ),
      },
      {
        id: 'type',
        header: t['col_type'],
        cell: (row) => (
          <Badge variant="secondary">
            {t[`type_${row.type}`] ?? row.type}
          </Badge>
        ),
      },
      {
        id: 'status',
        header: t['col_status'],
        cell: (row) => (
          <Badge variant={row.status as 'pending' | 'published' | 'rejected' | 'draft'}>
            {t[`postStatus_${row.status}`] ?? row.status}
          </Badge>
        ),
      },
      {
        id: 'id',
        header: 'ID',
        hiddenOnMobile: true,
        cell: (row) => (
          <span className="font-mono text-xs text-muted-foreground">{row.id.slice(0, 8)}</span>
        ),
      },
      {
        id: 'created',
        header: t['col_created'],
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
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Link
              href={`/admin/posts/${row.type}-${row.id}/edit`}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <Pencil className="h-3 w-3" />
            </Link>
            {row.status === 'pending' && (
              <AdminPostActions postId={row.id} postType={row.type} />
            )}
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
          { value: 'pending', label: t['postStatus_pending'] },
          { value: 'published', label: t['postStatus_published'] },
          { value: 'rejected', label: t['postStatus_rejected'] },
        ],
      },
      {
        key: 'type',
        label: t['col_type'],
        options: [
          { value: 'project', label: t['type_project'] },
          { value: 'product', label: t['type_product'] },
          { value: 'rfq', label: t['type_rfq'] },
        ],
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

  const bulkActions: BulkAction[] = useMemo(
    () => [
      {
        id: 'approve',
        label: t['action_approve'],
        icon: <CheckCircle className="h-4 w-4" />,
        variant: 'default' as const,
        onClick: (ids: string[]) => {
          startTransition(async () => {
            for (const id of ids) {
              const row = data.find((d) => d.id === id);
              if (row && row.status === 'pending') {
                await approvePost(row.id, row.type);
              }
            }
            setSelectedIds([]);
          });
        },
      },
      {
        id: 'reject',
        label: t['action_reject'],
        icon: <XCircle className="h-4 w-4" />,
        variant: 'destructive' as const,
        onClick: (ids: string[]) => {
          startTransition(async () => {
            for (const id of ids) {
              const row = data.find((d) => d.id === id);
              if (row && row.status === 'pending') {
                await rejectPost(row.id, row.type, 'Bulk rejection', 'Bulk rejection');
              }
            }
            setSelectedIds([]);
          });
        },
      },
    ],
    [t, data],
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
        filename: `admin-posts-${new Date().toISOString().slice(0, 10)}`,
        headers: [
          { key: 'title', label: t['col_title'] },
          { key: 'type', label: t['col_type'] },
          { key: 'status', label: t['col_status'] },
          { key: 'created_at', label: t['col_created'] },
        ],
        data: data.map((row) => ({
          title: row.title_ar || row.title_en || '',
          type: t[`type_${row.type}`] ?? row.type,
          status: t[`postStatus_${row.status}`] ?? row.status,
          created_at: new Date(row.created_at).toLocaleDateString(),
        })),
      }}
    >
      <DataTable
        columns={columns}
        data={data}
        getRowId={(row) => row.id}
        selectable
        onSelectionChange={setSelectedIds}
        stickyHeader
        maxHeight="600px"
        emptyState={
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title={t['noPosts']}
          />
        }
      />
    </AdminTableShell>
  );
}
