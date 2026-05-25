'use client';

import { useState, useMemo, useCallback, useTransition } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useRealtime } from '@/hooks';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DashboardTableShell, type FilterGroup } from '@/components/features/dashboard-table-shell';
import { type BulkAction } from '@/components/features/bulk-action-bar';
import { PostStatusBadge } from '@/components/features/post-status-badge';
import { EmptyState } from '@/components/features/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatSAR, formatDate, getLocaleField } from '@/lib/utils';
import { Package, Trash2, MessageSquare, EyeOff, Eye, DollarSign, BoxesIcon, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  bulkDeleteProducts,
  bulkUpdateProductStatus,
  bulkUpdateProductPrice,
  bulkUpdateProductStock,
  exportProductsCsv,
} from '@/actions/products';
import type { ProductRow } from './page';

// =============================================================================
// Products Table Client Wrapper — DashboardTableShell + bulk ops
// =============================================================================

interface ProductsTableClientProps {
  items: ProductRow[];
  locale: string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  translations: Record<string, string>;
  filterGroups: FilterGroup[];
  sortOptions: { value: string; label: string }[];
}

type ModalType = null | 'delete' | 'unpublish' | 'republish' | 'price' | 'stock';

export function ProductsTableClient({
  items,
  locale,
  totalCount,
  currentPage,
  totalPages,
  translations: t,
  filterGroups,
  sortOptions,
}: ProductsTableClientProps) {
  const router = useRouter();

  // Live updates when products change
  useRealtime({ channel: 'rt-products', table: 'products' });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkInStock, setBulkInStock] = useState(true);
  const [bulkStockQty, setBulkStockQty] = useState('');

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

  // ----- Bulk action handlers -----
  const handleBulkDelete = useCallback(() => {
    startTransition(async () => {
      const result = await bulkDeleteProducts(selectedIds);
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        const { deleted, failed } = result.data;
        if (deleted.length > 0) toast.success(`${deleted.length} ${t.delete || 'deleted'}`);
        if (failed.length > 0) toast.warning(`${failed.length} failed`);
        setSelectedIds([]);
        router.refresh();
      }
      setActiveModal(null);
    });
  }, [selectedIds, router, t]);

  const handleBulkUnpublish = useCallback(() => {
    startTransition(async () => {
      const result = await bulkUpdateProductStatus(selectedIds, 'draft');
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        toast.success(`${result.data.updated} ${t.unpublish || 'unpublished'}`);
        setSelectedIds([]);
        router.refresh();
      }
      setActiveModal(null);
    });
  }, [selectedIds, router, t]);

  const handleBulkRepublish = useCallback(() => {
    startTransition(async () => {
      const result = await bulkUpdateProductStatus(selectedIds, 'published');
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        toast.success(`${result.data.updated} ${t.republish || 'republished'}`);
        setSelectedIds([]);
        router.refresh();
      }
      setActiveModal(null);
    });
  }, [selectedIds, router, t]);

  const handleBulkPrice = useCallback(() => {
    const price = parseFloat(bulkPrice);
    if (isNaN(price) || price < 0.01) {
      toast.error('Invalid price');
      return;
    }
    startTransition(async () => {
      const result = await bulkUpdateProductPrice(selectedIds, price);
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        toast.success(`${result.data.updated} ${t.editPrice || 'updated'}`);
        if (result.data.skipped.length > 0) {
          toast.warning(`${result.data.skipped.length} skipped (variant pricing)`);
        }
        setSelectedIds([]);
        router.refresh();
      }
      setActiveModal(null);
      setBulkPrice('');
    });
  }, [selectedIds, bulkPrice, router, t]);

  const handleBulkStock = useCallback(() => {
    const qty = bulkStockQty ? parseInt(bulkStockQty, 10) : undefined;
    startTransition(async () => {
      const result = await bulkUpdateProductStock(selectedIds, bulkInStock, qty);
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        toast.success(`${result.data.updated} ${t.editStock || 'updated'}`);
        setSelectedIds([]);
        router.refresh();
      }
      setActiveModal(null);
      setBulkStockQty('');
    });
  }, [selectedIds, bulkInStock, bulkStockQty, router, t]);

  const handleExport = useCallback(() => {
    startTransition(async () => {
      const result = await exportProductsCsv();
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        const blob = new Blob([result.data.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.data.filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t.export || 'Exported');
      }
    });
  }, [t]);

  const bulkActions: BulkAction[] = useMemo(() => [
    {
      id: 'delete',
      label: t.delete,
      variant: 'destructive' as const,
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setActiveModal('delete'),
    },
    {
      id: 'unpublish',
      label: t.unpublish || 'Unpublish',
      variant: 'secondary' as const,
      icon: <EyeOff className="h-4 w-4" />,
      onClick: () => setActiveModal('unpublish'),
    },
    {
      id: 'republish',
      label: t.republish || 'Republish',
      variant: 'default' as const,
      icon: <Eye className="h-4 w-4" />,
      onClick: () => setActiveModal('republish'),
    },
    {
      id: 'price',
      label: t.editPrice || 'Edit Price',
      variant: 'outline' as const,
      icon: <DollarSign className="h-4 w-4" />,
      onClick: () => setActiveModal('price'),
    },
    {
      id: 'stock',
      label: t.editStock || 'Edit Stock',
      variant: 'outline' as const,
      icon: <BoxesIcon className="h-4 w-4" />,
      onClick: () => setActiveModal('stock'),
    },
  ], [t]);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  return (
    <>
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
        onSelectionClear={clearSelection}
      >
        {/* Export button in toolbar area */}
        <div className="flex justify-end mb-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isPending}>
            <Download className="me-1.5 h-4 w-4" />
            {t.export || 'Export CSV'}
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={items}
          getRowId={(row) => row.id}
          onRowClick={handleRowClick}
          selectable
          onSelectionChange={setSelectedIds}
          emptyState={
            <EmptyState
              icon={<Package className="h-12 w-12" />}
              title={t.noProducts}
              description={t.addFirstProduct}
              actionLabel={t.addProduct}
              actionHref="/dashboard/products/new"
            />
          }
        />
      </DashboardTableShell>

      {/* --- Confirmation Modals --- */}

      {/* Delete Confirmation */}
      <Dialog open={activeModal === 'delete'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.delete}</DialogTitle>
            <DialogDescription>
              {selectedIds.length} product(s) will be permanently deleted. Products with active deals cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>{t.cancel || 'Cancel'}</Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isPending}>
              {isPending ? '...' : t.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unpublish Confirmation */}
      <Dialog open={activeModal === 'unpublish'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.unpublish || 'Unpublish'}</DialogTitle>
            <DialogDescription>
              {selectedIds.length} product(s) will be unpublished and hidden from the marketplace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>{t.cancel || 'Cancel'}</Button>
            <Button size="sm" onClick={handleBulkUnpublish} disabled={isPending}>
              {isPending ? '...' : (t.unpublish || 'Unpublish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Republish Confirmation */}
      <Dialog open={activeModal === 'republish'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.republish || 'Republish'}</DialogTitle>
            <DialogDescription>
              {selectedIds.length} product(s) will be published and visible in the marketplace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>{t.cancel || 'Cancel'}</Button>
            <Button size="sm" onClick={handleBulkRepublish} disabled={isPending}>
              {isPending ? '...' : (t.republish || 'Republish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Price Modal */}
      <Dialog open={activeModal === 'price'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editPrice || 'Edit Price'}</DialogTitle>
            <DialogDescription>
              Set a new price for {selectedIds.length} product(s). Variant-priced products will be skipped.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00 SAR"
            value={bulkPrice}
            onChange={(e) => setBulkPrice(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setActiveModal(null); setBulkPrice(''); }}>{t.cancel || 'Cancel'}</Button>
            <Button size="sm" onClick={handleBulkPrice} disabled={isPending || !bulkPrice}>
              {isPending ? '...' : (t.editPrice || 'Update Price')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Stock Modal */}
      <Dialog open={activeModal === 'stock'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editStock || 'Edit Stock'}</DialogTitle>
            <DialogDescription>
              Update stock status for {selectedIds.length} product(s).
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">{t.stock}:</label>
            <Button
              variant={bulkInStock ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBulkInStock(true)}
            >
              {t.inStock}
            </Button>
            <Button
              variant={!bulkInStock ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setBulkInStock(false)}
            >
              {t.outOfStock}
            </Button>
          </div>
          <Input
            type="number"
            min="0"
            placeholder="Stock quantity (optional)"
            value={bulkStockQty}
            onChange={(e) => setBulkStockQty(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setActiveModal(null); setBulkStockQty(''); }}>{t.cancel || 'Cancel'}</Button>
            <Button size="sm" onClick={handleBulkStock} disabled={isPending}>
              {isPending ? '...' : (t.editStock || 'Update Stock')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
