// =============================================================================
// Public — Product Detail Page
// =============================================================================

import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatSAR, getLocaleField } from '@/lib/utils';
import { Package, ArrowRight, Building2, Shield, ShoppingCart, Truck } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function PublicProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const t = await getTranslations('public.productDetail');
  const locale = await getLocale();

  const { data: product } = await db(supabase)
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (!product) notFound();

  let variants: Array<{
    id: string;
    name_ar: string;
    name_en: string;
    sku: string | null;
    price: number;
    stock_quantity: number | null;
    sort_order: number;
  }> = [];

  if (product.pricing_model === 'variant') {
    const { data } = await db(supabase)
      .from('product_variants')
      .select('*')
      .eq('product_id', id)
      .order('sort_order', { ascending: true });
    variants = data ?? [];
  }

  const { data: supplier } = await db(supabase)
    .from('profiles')
    .select('id, full_name, company_name_ar, company_name_en, avatar_url, subscription_tier')
    .eq('id', product.supplier_id)
    .single();

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Link
        href="/marketplace"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        {t('backToMarketplace')}
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex h-72 items-center justify-center rounded-xl bg-muted">
            <Package className="h-16 w-16 text-muted-foreground/50" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {getLocaleField(product, 'name', locale)}
            </h1>
            <p className="mt-1 text-base text-muted-foreground" dir="ltr">
              {product.name_en}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={product.in_stock ? 'success' : 'destructive'}>
                {product.in_stock ? t('inStock') : t('outOfStock')}
              </Badge>
              {product.pricing_model === 'variant' && (
                <Badge variant="info">{t('multiVariant')}</Badge>
              )}
            </div>
          </div>

          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t('productDescription')}</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {product.description_ar}
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t('productDescriptionEn')}</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground" dir="ltr">
              {product.description_en}
            </p>
          </Card>

          {variants.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">{t('variants')}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-start">
                      <th className="py-2 pe-4 text-start font-medium text-muted-foreground">{t('variantName')}</th>
                      <th className="py-2 pe-4 text-start font-medium text-muted-foreground">{t('sku')}</th>
                      <th className="py-2 pe-4 text-start font-medium text-muted-foreground">{t('price')}</th>
                      <th className="py-2 text-start font-medium text-muted-foreground">{t('stock')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => (
                      <tr key={v.id} className="border-b border-border/50">
                        <td className="py-2.5 pe-4 font-medium text-foreground">
                          {getLocaleField(v, 'name', locale)}
                        </td>
                        <td className="py-2.5 pe-4 text-muted-foreground" dir="ltr">
                          {v.sku || '—'}
                        </td>
                        <td className="py-2.5 pe-4 font-semibold text-foreground">
                          {formatSAR(v.price)}
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {v.stock_quantity != null ? v.stock_quantity : t('unspecified')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-4">
              {product.pricing_model === 'fixed' && product.price ? (
                <>
                  <div className="text-3xl font-bold text-foreground">{formatSAR(product.price)}</div>
                  <div className="text-xs text-muted-foreground">{t('vatInclusive')}</div>
                </>
              ) : (
                <div className="text-lg font-semibold text-foreground">{t('variantPricing')}</div>
              )}
            </div>

            {user ? (
              <div className="space-y-2">
                <Button className="w-full">
                  <ShoppingCart className="me-2 h-4 w-4" />
                  {t('requestQuote')}
                </Button>
              </div>
            ) : (
              <Link href="/login" className="block">
                <Button className="w-full" variant="outline">
                  {t('loginToRequestQuote')}
                </Button>
              </Link>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t('productInfo')}</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('pricingType')}</dt>
                <dd className="font-medium text-foreground">
                  {product.pricing_model === 'fixed' ? t('fixedPrice') : t('multiVariant')}
                </dd>
              </div>
              {product.stock_quantity != null && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('stock')}</dt>
                  <dd className="font-medium text-foreground">{product.stock_quantity}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('status')}</dt>
                <dd>
                  <Badge variant={product.in_stock ? 'success' : 'destructive'}>
                    {product.in_stock ? t('inStock') : t('outOfStock')}
                  </Badge>
                </dd>
              </div>
            </dl>
          </Card>

          {supplier && (
            <Link href={`/partners/${supplier.id}`}>
              <Card className="p-5 transition-colors hover:bg-card/80">
                <h3 className="mb-3 text-sm font-semibold text-foreground">{t('supplierLabel')}</h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    {supplier.avatar_url ? (
                      <img src={supplier.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <Building2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {locale === 'ar'
                        ? (supplier.company_name_ar || supplier.full_name)
                        : (supplier.company_name_en || supplier.company_name_ar || supplier.full_name)}
                    </p>
                    {supplier.subscription_tier && (
                      <Badge
                        variant={supplier.subscription_tier as 'starter' | 'pro' | 'business' | 'enterprise'}
                        className="mt-1"
                      >
                        <Shield className="me-1 h-3 w-3" />
                        {supplier.subscription_tier}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
