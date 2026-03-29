'use client';

import { useCallback, useTransition } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Search, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { BulkActionBar, type BulkAction } from '@/components/features/bulk-action-bar';
import { downloadCSV, toCSV } from '@/components/features/analytics/csv-export';

// =============================================================================
// AdminTableShell — Unified wrapper for all admin data tables
// =============================================================================

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface ExportConfig {
  filename: string;
  headers: { key: string; label: string }[];
  data: Record<string, unknown>[];
}

interface AdminTableShellProps {
  children: React.ReactNode;
  /** Total count for "Showing X results" display */
  totalCount: number;
  /** Pagination */
  currentPage: number;
  totalPages: number;
  /** Filter groups for chip-based filtering */
  filterGroups?: FilterGroup[];
  /** Enable text search */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Sort options */
  sortOptions?: { value: string; label: string }[];
  /** Bulk actions */
  selectedIds?: string[];
  selectedCount?: number;
  bulkActions?: BulkAction[];
  onSelectionClear?: () => void;
  /** CSV export config */
  exportConfig?: ExportConfig;
  className?: string;
}

export function AdminTableShell({
  children,
  totalCount,
  currentPage,
  totalPages,
  filterGroups,
  searchable,
  searchPlaceholder,
  sortOptions,
  selectedIds = [],
  selectedCount = 0,
  bulkActions = [],
  onSelectionClear,
  exportConfig,
  className,
}: AdminTableShellProps) {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ------- URL param helpers -------
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val === null || val === '') {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      }
      // Reset to page 1 when filters change (unless page is explicitly being set)
      if (!('page' in updates)) {
        params.delete('page');
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, router],
  );

  const currentSearch = searchParams.get('search') ?? '';
  const currentSort = searchParams.get('sort') ?? '';

  // ------- Handlers -------
  const handleSearch = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const q = (formData.get('search') as string)?.trim() ?? '';
      updateParams({ search: q || null });
    },
    [updateParams],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      const current = searchParams.get(key);
      updateParams({ [key]: current === value ? null : value });
    },
    [searchParams, updateParams],
  );

  const handleSortChange = useCallback(
    (value: string) => {
      updateParams({ sort: value || null });
    },
    [updateParams],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateParams({ page: page > 1 ? String(page) : null });
    },
    [updateParams],
  );

  const handleClearFilters = useCallback(() => {
    const params = new URLSearchParams();
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [pathname, router]);

  const handleExport = useCallback(() => {
    if (!exportConfig) return;
    const csv = toCSV(exportConfig.headers, exportConfig.data);
    downloadCSV(csv, `${exportConfig.filename}.csv`);
  }, [exportConfig]);

  const hasActiveFilters =
    filterGroups?.some((g) => searchParams.has(g.key)) || !!currentSearch;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar: search + sort + export */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        {searchable && (
          <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="search"
              type="text"
              defaultValue={currentSearch}
              placeholder={searchPlaceholder ?? tc('search')}
              className="h-9 w-full rounded-lg border border-border bg-background ps-9 pe-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </form>
        )}

        {/* Sort */}
        {sortOptions && sortOptions.length > 0 && (
          <select
            value={currentSort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
          >
            <option value="">{tc('sort')}</option>
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {/* Export */}
        {exportConfig && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="me-1.5 h-4 w-4" />
            {t('table.export')}
          </Button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Result count */}
        <span className="text-sm text-muted-foreground">
          {t('table.showing', { count: totalCount })}
        </span>
      </div>

      {/* Filter chips */}
      {filterGroups && filterGroups.length > 0 && (
        <div className="space-y-2">
          {filterGroups.map((group) => (
            <div key={group.key} className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">{group.label}</span>
              {group.options.map((opt) => {
                const isActive = searchParams.get(group.key) === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleFilterChange(group.key, opt.value)}
                    className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          ))}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              {t('table.clearFilters')}
            </button>
          )}
        </div>
      )}

      {/* Loading overlay */}
      <div className={cn('transition-opacity', isPending && 'pointer-events-none opacity-50')}>
        {children}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Bulk action bar */}
      {bulkActions.length > 0 && (
        <BulkActionBar
          selectedCount={selectedCount}
          selectedIds={selectedIds}
          actions={bulkActions}
          onClear={onSelectionClear ?? (() => {})}
        />
      )}
    </div>
  );
}
