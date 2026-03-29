// =============================================================================
// Browse Pagination — Server-friendly pagination using <Link> tags
// Preserves all existing search params while paginating
// =============================================================================

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BrowsePaginationProps {
  currentPage: number;
  totalPages: number;
  /** Base search params to preserve (excluding 'page') */
  searchParams: Record<string, string | undefined>;
  className?: string;
  labels: { previous: string; next: string };
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

function buildQuery(searchParams: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key !== 'page' && value) params.set(key, value);
  }
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function BrowsePagination({
  currentPage,
  totalPages,
  searchParams,
  className,
  labels,
}: BrowsePaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav className={cn('flex items-center justify-center gap-1 mt-8', className)} aria-label="Pagination">
      {currentPage > 1 ? (
        <Link
          href={`${buildQuery(searchParams, currentPage - 1)}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm transition-colors hover:bg-muted"
          aria-label={labels.previous}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm opacity-50 pointer-events-none">
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e-${i}`} className="px-1 text-sm text-muted-foreground">...</span>
        ) : (
          <Link
            key={p}
            href={`${buildQuery(searchParams, p)}`}
            className={cn(
              'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors',
              currentPage === p
                ? 'bg-primary text-primary-foreground pointer-events-none'
                : 'border border-border hover:bg-muted',
            )}
          >
            {p}
          </Link>
        ),
      )}

      {currentPage < totalPages ? (
        <Link
          href={`${buildQuery(searchParams, currentPage + 1)}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm transition-colors hover:bg-muted"
          aria-label={labels.next}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm opacity-50 pointer-events-none">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
