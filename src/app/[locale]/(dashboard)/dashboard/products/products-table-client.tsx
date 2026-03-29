'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { BulkActionBar, type BulkAction } from '@/components/features/bulk-action-bar';
import { PostStatusBadge } from '@/components/features/post-status-badge';
import { EmptyState } from '@/components/features/empty-state';
import { formatSAR, formatDate, getLocaleField } from '@/lib/utils';
import { Package, Trash2, Send, MessageSquare } from 'lucide-react';
import type { ProductRow } from './page';

// =============================================================================
// Products Table Client Wrapper — selection state + bulk ops
// =============================================================================

interface ProductsTableClientProps {
  items: ProductRow[];
  locale: string;
  translations: Record<string, string>;
}

export function ProductsTableClient({ items, locale, translations: t }: ProductsTableClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const columns: ColumnDef<ProductRow>[] = useMemo(
    () => [
      {
        id: 'name',
        header: t.name,
        cell: (row) => (
          <span className="font-medium text-foreground">
            {getLocaleField(row as unknown as Record<string, unknown>, 'name', locale)}
          </span>
        ),
      },
      {
        id: 'status',
        header: t.status,
        cell: (row) => {
          const validStatuses = ['draft', 'pending', 'published', 'rejected', 'awarded', 'completed', 'expired', 'closed'] as const;
          const status = validStatuses.includes(row.status as typeof validStatuses[number])
            ? (row.status as typeof validStatuses[number])
            : 'draft';
          return <PostStatusBadge status={status} showIcon={false} />;
        },
      },
      {
        id: 'price',
        header: t.price,
        cell: (row) => (
          <span className="text-muted-foreground">
            {row.pricing_model === 'fixed'
              ? row.price ? formatSAR(row.price) : '—'
              : t.byVariants}
          </span>
        ),
        hiddenOnMobile: true,
      },
      {
        id: 'stock',
        header: t.stock,
        cell: (row) => (
          <span className={row.in_stock ? 'text-success font-medium' : 'text-destructive font-medium'}>
            {row.in_stock ? t.inStock : t.outOfStock}
          </span>
        ),
        hiddenOnMobile: true,
      },
      {
        id: 'inquiries',
        header: t.inquiries || 'Inquiries',
        cell: (row) => row.inquiry_count > 0 ? (
          <Link
            href={`/dashboard/inquiries?product_id=${row.id}`}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {row.inquiry_count}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">0</span>
        ),
        hiddenOnMobile: true,
      },
      {
        id: 'created',
        header: t.created,
        cell: (row) => (
          <span className="text-xs text-muted-foreground">{formatDate(row.created_at)}</span>
        ),
        hiddenOnMobile: true,
      },
    ],
    [locale, t],
  );

  const handleRowClick = useCallback(
    (row: ProductRow) => {
      router.push(`/dashboard/products/${row.id}`);
    },
    [router],
  );

  const bulkActions: BulkAction[] = useMemo(() => [
    {
      id: 'delete',
      label: t.delete,
      variant: 'destructive' as const,
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (ids: string[]) => {
        // TODO: wire to bulk delete server action
        console.log('Bulk delete:', ids);
      },
    },
  ], [t]);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-12 w-12" />}
        title={t.noProducts}
        description={t.addFirstProduct}
        actionLabel={t.addProduct}
        actionHref="/dashboard/products/new"
      />
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={items}
        getRowId={(row) => row.id}
        onRowClick={handleRowClick}
        selectable
        onSelectionChange={setSelectedIds}
      />
      <BulkActionBar
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        actions={bulkActions}
        onClear={clearSelection}
      />
    </>
  );
}
