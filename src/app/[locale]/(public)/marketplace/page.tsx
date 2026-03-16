// =============================================================================
// Marketplace Page — public product catalog with search & filters
// =============================================================================

import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { Package, Search, Star } from 'lucide-react';
import { formatSAR, getLocaleField } from '@/lib/utils';
import { getTranslations, getLocale } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; stock?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const t = await getTranslations('public.marketplace');
  const locale = await getLocale();

  let query = db(supabase)
    .from('products')
    .select('id, name_ar, name_en, description_ar, description_en, pricing_model, price, in_stock, created_at, supplier_id')
    .eq('status', 'published');

  // Text search
  if (params.q) {
    const pattern = `%${params.q}%`;
    query = query.or(`name_ar.ilike.${pattern},name_en.ilike.${pattern},description_ar.ilike.${pattern}`);
  }

  // Stock filter
  if (params.stock === 'true') {
    query = query.eq('in_stock', true);
  }

  // Sorting
  switch (params.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true, nullsFirst: false });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data: products } = await query.limit(50);

  const items = (products ?? []) as Array<{
    id: string;
    name_ar: string;
    name_en: string;
    description_ar: string;
    description_en: string;
    pricing_model: string;
    price: number | null;
    in_stock: boolean;
    created_at: string;
    supplier_id: string;
  }>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Filters Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <form method="GET" className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={params.q}
              placeholder={t('searchPlaceholder')}
              className="w-full rounded-lg border border-input bg-background py-2.5 pe-3 ps-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            name="stock"
            defaultValue={params.stock}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
          >
            <option value="">{t('allStock')}</option>
            <option value="true">{t('inStock')}</option>
          </select>
          <select
            name="sort"
            defaultValue={params.sort}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
          >
            <option value="recent">{t('sortRecent')}</option>
            <option value="price_asc">{t('sortPriceLow')}</option>
            <option value="price_desc">{t('sortPriceHigh')}</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
          >
            {t('search')}
          </button>
        </form>
      </div>

      {/* Results count */}
      <p className="mb-4 text-sm text-muted-foreground">
        {t('resultCount', { count: items.length })}
      </p>

      {/* Products Grid */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title={t('noProducts')}
          description={t('noProductsDesc')}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product Card
// ---------------------------------------------------------------------------
function ProductCard({
  product,
  locale,
  t,
}: {
  product: {
    id: string;
    name_ar: string;
    name_en: string;
    description_ar: string;
    description_en: string;
    pricing_model: string;
    price: number | null;
    in_stock: boolean;
  };
  locale: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  const name = getLocaleField(product, 'name', locale);
  const description = getLocaleField(product, 'description', locale);
  const desc = description?.slice(0, 80) + (description?.length > 80 ? '…' : '');

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="h-full overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20">
        {/* Placeholder image */}
        <div className="flex h-40 items-center justify-center bg-muted/50">
          <Package className="h-10 w-10 text-muted-foreground/30" />
        </div>

        <div className="space-y-2 p-4">
          <h3 className="truncate text-sm font-semibold text-foreground">{name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{desc}</p>

          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-foreground">
              {product.pricing_model === 'fixed'
                ? product.price ? formatSAR(product.price) : '—'
                : t('variantPricing')}
            </span>
            <Badge variant={product.in_stock ? 'success' : 'destructive'}>
              {product.in_stock ? t('available') : t('soldOut')}
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}
