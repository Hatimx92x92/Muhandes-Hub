'use client';

import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpDown } from 'lucide-react';

// =============================================================================
// DataTable — Reusable table with row selection + optional bulk ops
// =============================================================================

export interface ColumnDef<T> {
  /** Unique key for the column */
  id: string;
  /** Header label */
  header: string;
  /** Render the cell content */
  cell: (row: T) => React.ReactNode;
  /** Optional sortable key (visual only — sorting delegated to server) */
  sortKey?: string;
  /** Optional className for the column */
  className?: string;
  /** Whether this column is hidden on mobile (default: false) */
  hiddenOnMobile?: boolean;
}

export interface DataTableProps<T> {
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Data rows */
  data: T[];
  /** Unique key extractor */
  getRowId: (row: T) => string;
  /** Called when a row is clicked (navigation, etc.) */
  onRowClick?: (row: T) => void;
  /** Enable row selection checkboxes (default: false) */
  selectable?: boolean;
  /** Callback when selection changes */
  onSelectionChange?: (selectedIds: string[]) => void;
  /** Current sort key for visual indicator */
  currentSort?: string;
  /** Current sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Called when a sortable column header is clicked */
  onSortChange?: (sortKey: string) => void;
  /** Custom className for the wrapper */
  className?: string;
  /** Empty state component */
  emptyState?: React.ReactNode;
  /** Stick the header row to the top when scrolling (default: false) */
  stickyHeader?: boolean;
  /** Max height for the table wrapper — enables vertical scroll (e.g. "600px") */
  maxHeight?: string;
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  onRowClick,
  selectable = false,
  onSelectionChange,
  currentSort,
  sortDirection,
  onSortChange,
  className,
  emptyState,
  stickyHeader = false,
  maxHeight,
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const t = useTranslations('dashboard.common');

  const allIds = useMemo(() => data.map(getRowId), [data, getRowId]);
  const allSelected = data.length > 0 && selectedIds.size === data.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleAll = useCallback(() => {
    const next = allSelected ? new Set<string>() : new Set(allIds);
    setSelectedIds(next);
    onSelectionChange?.(Array.from(next));
  }, [allSelected, allIds, onSelectionChange]);

  const toggleRow = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onSelectionChange?.(Array.from(next));
        return next;
      });
    },
    [onSelectionChange],
  );

  // Expose selected IDs for parent via onSelectionChange
  const selectedArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div
      className={cn('overflow-x-auto rounded-xl border border-border bg-card', stickyHeader && maxHeight && 'overflow-y-auto', className)}
      style={stickyHeader && maxHeight ? { maxHeight } : undefined}
    >
      <table className="w-full text-sm">
        <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
          <tr className={cn('border-b border-border', stickyHeader ? 'bg-muted' : 'bg-muted/40')}>
            {selectable && (
              <th className="w-12 px-3 py-3 text-center">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={toggleAll}
                  aria-label={t('selectAll')}
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.id}
                className={cn(
                  'px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                  col.hiddenOnMobile && 'hidden md:table-cell',
                  col.sortKey && 'cursor-pointer select-none hover:text-foreground',
                  col.className,
                )}
                onClick={col.sortKey ? () => onSortChange?.(col.sortKey!) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortKey && (
                    <ArrowUpDown
                      className={cn(
                        'h-3 w-3',
                        currentSort === col.sortKey
                          ? 'text-foreground'
                          : 'text-muted-foreground/40',
                      )}
                    />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const id = getRowId(row);
            const isSelected = selectedIds.has(id);

            return (
              <tr
                key={id}
                className={cn(
                  'border-b border-border/50 transition-colors last:border-b-0',
                  isSelected
                    ? 'bg-primary/5'
                    : 'hover:bg-muted/30',
                  onRowClick && 'cursor-pointer',
                )}
                onClick={(e) => {
                  // Don't trigger row click if checkbox was clicked
                  if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
                  onRowClick?.(row);
                }}
              >
                {selectable && (
                  <td className="w-12 px-3 py-3 text-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleRow(id)}
                      aria-label={`Select row ${id}`}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cn(
                      'px-4 py-3',
                      col.hiddenOnMobile && 'hidden md:table-cell',
                      col.className,
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
