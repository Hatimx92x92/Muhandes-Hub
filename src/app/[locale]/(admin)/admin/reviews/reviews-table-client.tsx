'use client';

import { useState, useMemo, useTransition } from 'react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { AdminTableShell, type FilterGroup } from '@/components/features/admin/admin-table-shell';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { AdminReviewActions } from '@/components/features/admin/review-actions';
import { Star, EyeOff } from 'lucide-react';
import { toggleReviewVisibility } from '@/actions/admin/moderation';
import type { AdminReviewRow } from '@/actions/admin/queries';
import type { BulkAction } from '@/components/features/bulk-action-bar';

// =============================================================================
// Admin Reviews Table Client
// =============================================================================

interface ReviewsTableClientProps {
  data: AdminReviewRow[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  translations: Record<string, string>;
}

export function ReviewsTableClient({ data, totalCount, currentPage, totalPages, translations: t }: ReviewsTableClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  const columns: ColumnDef<AdminReviewRow>[] = useMemo(
    () => [
      {
        id: 'rating',
        header: t['col_rating'],
        sortKey: 'overall_rating',
        cell: (row) => (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="font-medium">{row.overall_rating}</span>
          </div>
        ),
      },
      {
        id: 'comment',
        header: t['col_comment'],
        cell: (row) => (
          <p className="max-w-xs truncate text-sm text-muted-foreground">
            {row.comment_ar || row.comment_en || '—'}
          </p>
        ),
      },
      {
        id: 'visibility',
        header: t['col_visibility'],
        cell: (row) => (
          <Badge variant={row.is_hidden ? 'destructive' : 'success'}>
            {row.is_hidden ? t['visibility_hidden'] : t['visibility_visible']}
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
            <AdminReviewActions reviewId={row.id} isHidden={row.is_hidden} />
          </div>
        ),
      },
    ],
    [t],
  );

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'visibility',
        label: t['col_visibility'],
        options: [
          { value: 'visible', label: t['visibility_visible'] },
          { value: 'hidden', label: t['visibility_hidden'] },
        ],
      },
    ],
    [t],
  );

  const sortOptions = useMemo(
    () => [
      { value: 'created_at:desc', label: t['sort_newest'] },
      { value: 'created_at:asc', label: t['sort_oldest'] },
      { value: 'overall_rating:desc', label: t['sort_ratingHigh'] },
      { value: 'overall_rating:asc', label: t['sort_ratingLow'] },
    ],
    [t],
  );

  const bulkActions: BulkAction[] = useMemo(
    () => [
      {
        id: 'hide',
        label: t['action_hide'],
        icon: <EyeOff className="h-4 w-4" />,
        variant: 'destructive' as const,
        onClick: (ids: string[]) => {
          startTransition(async () => {
            for (const id of ids) {
              const row = data.find((d) => d.id === id);
              if (row && !row.is_hidden) {
                await toggleReviewVisibility(id, true);
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
      sortOptions={sortOptions}
      selectedIds={selectedIds}
      selectedCount={selectedIds.length}
      bulkActions={bulkActions}
      onSelectionClear={() => setSelectedIds([])}
      exportConfig={{
        filename: `admin-reviews-${new Date().toISOString().slice(0, 10)}`,
        headers: [
          { key: 'rating', label: t['col_rating'] },
          { key: 'comment', label: t['col_comment'] },
          { key: 'visibility', label: t['col_visibility'] },
          { key: 'created_at', label: t['col_created'] },
        ],
        data: data.map((row) => ({
          rating: row.overall_rating,
          comment: row.comment_ar || row.comment_en || '',
          visibility: row.is_hidden ? (t['visibility_hidden'] ?? 'hidden') : (t['visibility_visible'] ?? 'visible'),
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
            icon={<Star className="h-12 w-12" />}
            title={t['noReviews']}
          />
        }
      />
    </AdminTableShell>
  );
}
