// =============================================================================
// Dashboard — Product Detail / Edit Page
// =============================================================================

import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { backfillEntityTranslation } from '@/actions/admin/translate-backfill';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PostStatusBadge } from '@/components/features/post-status-badge';
import { ProductForm } from '@/components/forms/product-form';
import { PageHeader } from '@/components/ui/page-header';
import { formatSAR, formatDate, getLocaleField } from '@/lib/utils';
import { Trash2, Package, Clock, Layers } from 'lucide-react';
import { deleteProduct } from '@/actions/products';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch product by ID — must belong to the current user
  const { data: product } = await db(supabase)
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('supplier_id', user.id)
    .single();

  if (!product) notFound();

  // Backfill missing locale fields after render (fire-and-forget, free DeepL)
  if (!product[`name_${locale}`] || !product[`description_${locale}`]) {
    after(() => backfillEntityTranslation('products', product.id, product, ['name', 'description']));
  }

  // Fetch variants if variant-based pricing
  let variants: { name_ar: string; name_en: string; sku: string | null; price: number; stock_quantity: number | null; sort_order: number }[] = [];
  if (product.pricing_model === 'variant') {
    const { data: variantData } = await db(supabase)
      .from('product_variants')
      .select('name_ar, name_en, sku, price, stock_quantity, sort_order')
      .eq('product_id', id)
      .order('sort_order', { ascending: true });
    variants = variantData ?? [];
  }

  // Fetch product images
  const { data: productImages } = await db(supabase)
    .from('product_images')
    .select('id, image_url, display_order, is_primary')
    .eq('product_id', id)
    .order('display_order', { ascending: true });

  // Fetch product spec sheets
  const { data: productSpecs } = await db(supabase)
    .from('product_spec_sheets')
    .select('id, file_url, file_name, file_size')
    .eq('product_id', id)
    .order('created_at', { ascending: true });

  const t = await getTranslations('dashboard.products');
  const tDetail = await getTranslations('dashboard.products.detail');
  const tCommon = await getTranslations('dashboard.common');

  const validStatuses = ['draft', 'pending', 'published', 'rejected', 'awarded', 'completed', 'expired', 'closed'] as const;
  const status = validStatuses.includes(product.status) ? product.status : 'draft';
  const canEdit = true;
  const canDelete = true; // Can delete any product (active deals checked server-side)

  return (
    <div className="space-y-6">
      <BreadcrumbOverride segment={id} label={getLocaleField(product, 'name', locale)} />

      <PageHeader
        title={getLocaleField(product, 'name', locale)}
        badge={
          <div className="flex items-center gap-2">
            <PostStatusBadge status={status} />
            <Badge variant="outline">
              {product.pricing_model === 'fixed' ? tDetail('fixedPrice') : tDetail('variantBased')}
            </Badge>
          </div>
        }
        backHref="/dashboard/products"
        action={
          canDelete && (
            <form action={async () => {
              'use server';
              await deleteProduct(id);
              redirect('/dashboard/products');
            }}>
              <Button variant="destructive" size="sm">
                <Trash2 className="me-1.5 h-4 w-4" />
                {tCommon('delete')}
              </Button>
            </form>
          )
        }
      />

      {/* Edit Form OR Read-Only Details */}
      {canEdit ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{tDetail('editProduct')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{tDetail('editProductDesc')}</p>
          </div>
          <Card className="p-6">
            <ProductForm
              mode="edit"
              defaultValues={{
                product_id: product.id,
                name_ar: product.name_ar,
                name_en: product.name_en,
                description_ar: product.description_ar,
                description_en: product.description_en,
                category_id: product.category_id,
                pricing_model: product.pricing_model,
                price: product.price,
                in_stock: product.in_stock,
                stock_quantity: product.stock_quantity,
                min_order_qty: product.min_order_qty,
                lead_time_days: product.lead_time_days,
                variants: variants.map((v) => ({
                  name_ar: v.name_ar,
                  name_en: v.name_en,
                  sku: v.sku || '',
                  price: String(v.price),
                  stock_quantity: v.stock_quantity != null ? String(v.stock_quantity) : '',
                  sort_order: v.sort_order,
                })),
                existingImages: productImages ?? [],
                existingSpecs: productSpecs ?? [],
              }}
            />
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content — Read-Only */}
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            <Card className="p-6">
              <h2 className="mb-3 text-lg font-semibold text-foreground">{tCommon('description')}</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {getLocaleField(product, 'description', locale)}
              </p>
            </Card>

            {/* Variants Table (if variant pricing) */}
            {product.pricing_model === 'variant' && variants.length > 0 && (
              <Card className="p-6">
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  <Layers className="me-2 inline h-5 w-5" />
                  {t('variants')}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-start">
                        <th className="pb-2 pe-4 text-start font-medium text-muted-foreground">{t('name')}</th>
                        <th className="pb-2 pe-4 text-start font-medium text-muted-foreground">{t('price')}</th>
                        <th className="pb-2 text-start font-medium text-muted-foreground">{t('inStock')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0">
                          <td className="py-2 pe-4 font-medium text-foreground">
                            {getLocaleField(v as unknown as Record<string, unknown>, 'name', locale)}
                          </td>
                          <td className="py-2 pe-4 text-muted-foreground">{formatSAR(v.price)}</td>
                          <td className="py-2 text-muted-foreground">
                            {v.stock_quantity != null ? v.stock_quantity : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Product Info */}
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{tDetail('productDetails')}</h3>
              <dl className="space-y-3 text-sm">
                {product.pricing_model === 'fixed' && product.price && (
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <dt className="text-muted-foreground">{t('price')}:</dt>
                    <dd className="font-medium text-foreground">{formatSAR(product.price)}</dd>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <dt className="text-muted-foreground">{t('inStock')}:</dt>
                  <dd className={`font-medium ${product.in_stock ? 'text-status-completed' : 'text-destructive'}`}>
                    {product.in_stock ? t('inStock') : t('outOfStock')}
                  </dd>
                </div>
                {product.stock_quantity != null && (
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <dt className="text-muted-foreground">{tDetail('stockQuantity')}:</dt>
                    <dd className="font-medium text-foreground">{product.stock_quantity}</dd>
                  </div>
                )}
                {product.lead_time_days != null && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <dt className="text-muted-foreground">{tDetail('leadTimeDays')}:</dt>
                    <dd className="font-medium text-foreground">{product.lead_time_days} {tDetail('days')}</dd>
                  </div>
                )}
              </dl>
            </Card>

            {/* Timestamps */}
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{tCommon('dates')}</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">{tCommon('createdAt')}</dt>
                  <dd className="font-medium text-foreground">{formatDate(product.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{tCommon('updatedAt')}</dt>
                  <dd className="font-medium text-foreground">{formatDate(product.updated_at)}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
