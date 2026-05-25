// =============================================================================
// Marketplace Page — public product catalog with search & filters
// =============================================================================

import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/features/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Search, Star } from 'lucide-react';
import { formatSAR, getLocaleField, getEntitySlug } from '@/lib/utils';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BrowsePagination } from '@/components/features/browse-pagination';
import { SavedFilters } from '@/components/features/saved-filters';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://muhandeshub.com';
const PAGE_SIZE = 24;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

// ---------------------------------------------------------------------------
// SEO — generateMetadata
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('metadata.marketplace');

  return {
    title: t('title'),
    description: t('description'),
    ...(sp.q ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      alternateLocale: locale === 'ar' ? 'en_US' : 'ar_SA',
      siteName: 'Muhandes HUB',
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/marketplace`,
      languages: {
        ar: `${BASE_URL}/ar/marketplace`,
        en: `${BASE_URL}/en/marketplace`,
      },
    },
  };
}

export default async function MarketplacePage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; sort?: string; stock?: string; page?: string }>;
}) {
  const { locale } = await routeParams;
  setRequestLocale(locale);
  const params = await searchParams;
  const supabase = await createClient();
  const t = await getTranslations('public.marketplace');
  const sf = await getTranslations('features.savedFilters');
  const { data: { user } } = await supabase.auth.getUser();
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = db(supabase)
    .from('products')
    .select('id, name_ar, name_en, description_ar, description_en, pricing_model, price, in_stock, created_at, supplier_id, slug_ar, slug_en', { count: 'exact' })
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

  const { data: products, count } = await query.range(from, to);
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

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
    <div className="py-16">
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
          <Select name="stock" defaultValue={params.stock}>
            <SelectTrigger>
              <SelectValue placeholder={t('allStock')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('allStock')}</SelectItem>
              <SelectItem value="true">{t('inStock')}</SelectItem>
            </SelectContent>
          </Select>
          <Select name="sort" defaultValue={params.sort}>
            <SelectTrigger>
              <SelectValue placeholder={t('sortRecent')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{t('sortRecent')}</SelectItem>
              <SelectItem value="price_asc">{t('sortPriceLow')}</SelectItem>
              <SelectItem value="price_desc">{t('sortPriceHigh')}</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit">
            {t('search')}
          </Button>
        </form>
      </div>

      {/* Results count + Saved filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t('resultCount', { count: count ?? items.length })}
        </p>
        <SavedFilters
          page="marketplace"
          translations={{ save: sf('save'), saveTitle: sf('saveTitle'), namePlaceholder: sf('namePlaceholder'), cancel: sf('cancel'), confirm: sf('confirm') }}
          isAuthenticated={!!user}
        />
      </div>

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

      <BrowsePagination
        currentPage={currentPage}
        totalPages={totalPages}
        searchParams={params as Record<string, string | undefined>}
        labels={{ previous: t('previous'), next: t('next') }}
      />
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
    slug_ar?: string | null;
    slug_en?: string | null;
  };
  locale: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  const name = getLocaleField(product, 'name', locale);
  const description = getLocaleField(product, 'description', locale);
  const desc = description?.slice(0, 80) + (description?.length > 80 ? '…' : '');

  return (
    <Link href={`/products/${getEntitySlug(product, locale)}`}>
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
