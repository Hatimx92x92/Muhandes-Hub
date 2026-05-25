// =============================================================================
// Public — Product Detail Page
// =============================================================================

import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { after } from 'next/server';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { backfillEntityTranslation } from '@/actions/admin/translate-backfill';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/features/user-avatar';
import { formatSAR, getLocaleField, isUUID, getEntitySlug, truncate } from '@/lib/utils';
import { Package, Building2, Shield, ShoppingCart, Truck, Pencil } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';
import { ProductInquiryButton } from '@/components/features/product-inquiry-button';
import { FileActions } from '@/components/features/file-actions';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://muhandeshub.com';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

// ---------------------------------------------------------------------------
// Shared product fetch for both generateMetadata & page component
// ---------------------------------------------------------------------------
async function fetchProduct(slug: string, locale: string) {
  const supabase = await createClient();
  const slugCol = locale === 'ar' ? 'slug_ar' : 'slug_en';
  let { data: product } = await db(supabase)
    .from('products')
    .select('*')
    .eq(slugCol, slug)
    .eq('status', 'published')
    .single();

  if (!product) {
    const fallbackCol = locale === 'ar' ? 'slug_en' : 'slug_ar';
    ({ data: product } = await db(supabase)
      .from('products')
      .select('*')
      .eq(fallbackCol, slug)
      .eq('status', 'published')
      .single());
  }

  if (!product) return null;

  const { data: supplier } = await db(supabase)
    .from('profiles')
    .select('id, full_name, company_name_ar, company_name_en, avatar_url, slug_ar, slug_en')
    .eq('id', product.supplier_id)
    .single();

  const { data: productImages } = await db(supabase)
    .from('product_images')
    .select('id, image_url, display_order, is_primary')
    .eq('product_id', product.id)
    .order('display_order', { ascending: true });

  const primaryImage = productImages?.find((img: { is_primary: boolean }) => img.is_primary) ?? productImages?.[0];

  return { product, supplier, productImages, primaryImage };
}

// ---------------------------------------------------------------------------
// SEO — generateMetadata
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  setRequestLocale(locale);
  let slug: string;
  try { slug = decodeURIComponent(rawSlug); } catch { slug = rawSlug; }

  if (isUUID(slug)) return {};

  const result = await fetchProduct(slug, locale);
  if (!result) return {};

  const { product, supplier, primaryImage } = result;
  const name = getLocaleField(product, 'name', locale);
  const description = truncate(getLocaleField(product, 'description', locale), 160);
  const supplierName = supplier
    ? getLocaleField(supplier, 'company_name', locale) || supplier.full_name
    : '';
  const imageUrl = primaryImage?.image_url;

  const arSlug = product.slug_ar || slug;
  const enSlug = product.slug_en || slug;

  return {
    title: `${name} | Muhandes HUB`,
    description,
    openGraph: {
      title: name,
      description,
      type: 'website',
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      alternateLocale: locale === 'ar' ? 'en_US' : 'ar_SA',
      siteName: 'Muhandes HUB',
      ...(imageUrl && {
        images: [{ url: imageUrl, alt: name }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/products/${locale === 'ar' ? arSlug : enSlug}`,
      languages: {
        ar: `${BASE_URL}/ar/products/${arSlug}`,
        en: `${BASE_URL}/en/products/${enSlug}`,
      },
    },
    other: {
      ...(product.pricing_model === 'fixed' && product.price
        ? {
            'product:price:amount': String(product.price),
            'product:price:currency': 'SAR',
          }
        : {}),
      ...(supplierName ? { 'product:brand': supplierName } : {}),
      'product:availability': product.in_stock ? 'instock' : 'oos',
    },
  };
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default async function PublicProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug: rawSlug } = await params;
  setRequestLocale(locale);
  let slug: string;
  try { slug = decodeURIComponent(rawSlug); } catch { slug = rawSlug; }
  const supabase = await createClient();
  const t = await getTranslations('public.productDetail');

  // UUID redirect: old ID-based URLs → slug-based
  if (isUUID(slug)) {
    const { data: record } = await db(supabase)
      .from('products')
      .select('slug_ar, slug_en')
      .eq('id', slug)
      .single();
    if (record) {
      const targetSlug = getEntitySlug(record, locale);
      if (targetSlug) redirect(`/products/${targetSlug}`);
    }
    notFound();
  }

  // Fetch by locale-appropriate slug with cross-locale fallback
  const slugCol = locale === 'ar' ? 'slug_ar' : 'slug_en';
  let { data: product } = await db(supabase)
    .from('products')
    .select('*')
    .eq(slugCol, slug)
    .eq('status', 'published')
    .single();

  if (!product) {
    const fallbackCol = locale === 'ar' ? 'slug_en' : 'slug_ar';
    ({ data: product } = await db(supabase)
      .from('products')
      .select('*')
      .eq(fallbackCol, slug)
      .eq('status', 'published')
      .single());
  }

  if (!product) notFound();

  // Backfill missing locale fields after render (fire-and-forget, free DeepL)
  if (!product[`name_${locale}`] || !product[`description_${locale}`]) {
    after(() => backfillEntityTranslation('products', product.id, product, ['name', 'description']));
  }

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
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true });
    variants = data ?? [];
  }

  const { data: supplier } = await db(supabase)
    .from('profiles')
    .select('id, full_name, company_name_ar, company_name_en, avatar_url, slug_ar, slug_en')
    .eq('id', product.supplier_id)
    .single();

  const { data: supplierSub } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', product.supplier_id)
    .eq('is_active', true)
    .single();
  const supplierTier = supplierSub?.tier || 'starter';

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch product images
  const { data: productImages } = await db(supabase)
    .from('product_images')
    .select('id, image_url, display_order, is_primary')
    .eq('product_id', product.id)
    .order('display_order', { ascending: true });

  // Fetch product spec sheets
  const { data: productSpecs } = await db(supabase)
    .from('product_spec_sheets')
    .select('id, file_url, file_name, file_size')
    .eq('product_id', product.id)
    .order('created_at', { ascending: true });

  // Fetch more products from the same supplier
  const { data: moreFromSupplier } = await db(supabase)
    .from('products')
    .select('id, name_ar, name_en, slug_ar, slug_en, price, pricing_model')
    .eq('supplier_id', product.supplier_id)
    .eq('status', 'published')
    .neq('id', product.id)
    .limit(4);

  const primaryImage = productImages?.find((img: { is_primary: boolean }) => img.is_primary) ?? productImages?.[0];

  // Build JSON-LD Product structured data for Google / Merchant Center
  const productName = getLocaleField(product, 'name', locale);
  const productDescription = getLocaleField(product, 'description', locale);
  const supplierName = supplier
    ? getLocaleField(supplier, 'company_name', locale) || supplier.full_name
    : 'Muhandes HUB';
  const imageUrls = (productImages ?? []).map((img: { image_url: string }) => img.image_url);
  const productUrl = `${BASE_URL}/${locale}/products/${locale === 'ar' ? (product.slug_ar || slug) : (product.slug_en || slug)}`;

  const offersJsonLd = product.pricing_model === 'variant' && variants.length > 0
    ? variants.map((v) => ({
        '@type': 'Offer',
        url: productUrl,
        priceCurrency: 'SAR',
        price: v.price,
        availability: product.in_stock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: supplierName },
        ...(v.sku ? { sku: v.sku } : {}),
        name: getLocaleField(v, 'name', locale),
      }))
    : [{
        '@type': 'Offer',
        url: productUrl,
        priceCurrency: 'SAR',
        price: product.price ?? 0,
        availability: product.in_stock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: supplierName },
      }];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    description: productDescription,
    image: imageUrls.length > 0 ? imageUrls : undefined,
    sku: product.id,
    brand: { '@type': 'Organization', name: supplierName },
    offers: offersJsonLd.length === 1 ? offersJsonLd[0] : offersJsonLd,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: locale === 'ar' ? 'الرئيسية' : 'Home', item: `${BASE_URL}/${locale}` },
      { '@type': 'ListItem', position: 2, name: locale === 'ar' ? 'السوق' : 'Marketplace', item: `${BASE_URL}/${locale}/marketplace` },
      { '@type': 'ListItem', position: 3, name: productName, item: `${BASE_URL}/${locale}/products/${slug}` },
    ],
  };

  return (
    <div className="py-16">
      {/* JSON-LD structured data for Google / Merchant Center */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <BreadcrumbOverride segment={slug} label={getLocaleField(product, 'name', locale)} />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Image Gallery */}
          {productImages && productImages.length > 0 ? (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl bg-muted" style={{ height: 288 }}>
                <Image
                  src={primaryImage?.image_url}
                  alt={getLocaleField(product, 'name', locale)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority
                />
              </div>
              {productImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
                  {productImages.map((img: { id: string; image_url: string }, idx: number) => (
                    <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={img.image_url}
                        alt={`${getLocaleField(product, 'name', locale)} ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 25vw, (max-width: 768px) 20vw, 16vw"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center rounded-xl bg-muted">
              <Package className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {getLocaleField(product, 'name', locale)}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={product.in_stock ? 'success' : 'destructive'}>
                  {product.in_stock ? t('inStock') : t('outOfStock')}
                </Badge>
                {product.pricing_model === 'variant' && (
                  <Badge variant="info">{t('multiVariant')}</Badge>
                )}
              </div>
            </div>
            {user && user.id === product.supplier_id && (
              <Link href={`/dashboard/products/${product.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4 me-1.5" />
                  {t('manageListing')}
                </Button>
              </Link>
            )}
          </div>

          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t('productDescription')}</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {getLocaleField(product, 'description', locale)}
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

          {/* Catalogs / Spec Sheets */}
          {productSpecs && productSpecs.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">{t('catalogs')}</h2>
              <ul className="space-y-2">
                {productSpecs.map((spec: { id: string; file_url: string; file_name: string; file_size: number }) => (
                  <li key={spec.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                    <Package className="h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{spec.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {spec.file_size < 1024 * 1024
                          ? `${(spec.file_size / 1024).toFixed(0)} KB`
                          : `${(spec.file_size / (1024 * 1024)).toFixed(1)} MB`}
                      </p>
                    </div>
                    <FileActions url={spec.file_url} fileName={spec.file_name} compact />
                  </li>
                ))}
              </ul>
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
                <ProductInquiryButton
                  productId={product.id}
                  isOwnProduct={product.supplier_id === user.id}
                />
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
            <Link href={`/partners/${getEntitySlug(supplier, locale)}`}>
              <Card className="p-5 transition-colors hover:bg-card/80">
                <h3 className="mb-3 text-sm font-semibold text-foreground">{t('supplierLabel')}</h3>
                <div className="flex items-center gap-3">
                  <UserAvatar src={supplier.avatar_url} name={supplier.full_name} size="md" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {locale === 'ar'
                        ? (supplier.company_name_ar || supplier.full_name)
                        : (supplier.company_name_en || supplier.company_name_ar || supplier.full_name)}
                    </p>
                    {supplierTier && supplierTier !== 'starter' && (
                      <Badge
                        variant={supplierTier as 'pro' | 'business' | 'enterprise'}
                        className="mt-1"
                      >
                        <Shield className="me-1 h-3 w-3" />
                        {supplierTier}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          )}
        </div>
      </div>

      {/* More from this Supplier */}
      {moreFromSupplier && moreFromSupplier.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-6 text-xl font-bold text-foreground">{t('moreFromSupplier')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {moreFromSupplier.map((item: { id: string; name_ar: string; name_en: string; slug_ar: string | null; slug_en: string | null; price: number | null; pricing_model: string }) => (
              <Link key={item.id} href={`/products/${getEntitySlug(item, locale) || item.id}`}>
                <Card className="p-4 transition-colors hover:bg-card/80 h-full">
                  <div className="flex h-16 items-center justify-center rounded-lg bg-muted mb-3">
                    <Package className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground line-clamp-2">
                    {getLocaleField(item, 'name', locale)}
                  </h3>
                  {item.pricing_model === 'fixed' && item.price && (
                    <p className="mt-1 text-sm font-semibold text-primary">{formatSAR(item.price)}</p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
