// =============================================================================
// Dashboard — My Products List
// =============================================================================

import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/features/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { TierLimitIndicator } from '@/components/features/tier-gate';
import { Plus, Package, AlertTriangle, EyeOff } from 'lucide-react';
import { TIER_LIMITS } from '@/types';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProductsTableClient } from './products-table-client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export interface ProductRow {
  id: string;
  name_ar: string;
  name_en: string;
  pricing_model: string;
  price: number | null;
  in_stock: boolean;
  status: string;
  created_at: string;
  inquiry_count: number;
}

export default async function ProductsListPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; page?: string; search?: string; sort?: string }>;
}) {
  const { locale } = await routeParams;
  setRequestLocale(locale);
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Supplier only
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'supplier') {
    redirect('/dashboard');
  }

  const { data: subscription } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const tier = (subscription?.tier || 'starter') as keyof typeof TIER_LIMITS;
  const limits = TIER_LIMITS[tier];
  const maxProducts = limits?.productPosts ?? 2;

  const t = await getTranslations('dashboard.products');
  const tCommon = await getTranslations('dashboard.common');

  const page = Math.max(1, Number(params.page) || 1);
  const perPage = 20;
  const search = params.search?.trim() || '';
  const sort = params.sort || '';

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: 'created_at', ascending: false },
    oldest: { column: 'created_at', ascending: true },
    priceHigh: { column: 'price', ascending: false },
    priceLow: { column: 'price', ascending: true },
  };
  const sortConfig = sortMap[sort] ?? sortMap.newest;

  // Fetch products with pagination
  let query = db(supabase)
    .from('products')
    .select('id, name_ar, name_en, pricing_model, price, in_stock, status, created_at, inquiries(count)', { count: 'exact' })
    .eq('supplier_id', user.id)
    .order(sortConfig.column, { ascending: sortConfig.ascending });

  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (search) {
    query = query.or(`name_ar.ilike.%${search}%,name_en.ilike.%${search}%`);
  }

  const { data: products, count: totalCountRaw } = await query.range((page - 1) * perPage, page * perPage - 1);

  const items = (products ?? []).map((p: ProductRow & { inquiries: { count: number }[] }) => ({
    id: p.id,
    name_ar: p.name_ar,
    name_en: p.name_en,
    pricing_model: p.pricing_model,
    price: p.price,
    in_stock: p.in_stock,
    status: p.status,
    created_at: p.created_at,
    inquiry_count: p.inquiries?.[0]?.count ?? 0,
  })) as ProductRow[];

  const totalCount = totalCountRaw ?? 0;
  const totalPages = Math.ceil(totalCount / perPage);

  // Unfiltered used count (for limit)
  const { count: usedCountRaw } = await db(supabase)
    .from('products').select('id', { count: 'exact' })
    .eq('supplier_id', user.id);
  const usedCount = usedCountRaw ?? 0;
  const atLimit = maxProducts !== Infinity && usedCount >= maxProducts;

  // Stats — unfiltered counts
  const { count: unpublishedCountRaw } = await db(supabase)
    .from('products').select('id', { count: 'exact' })
    .eq('supplier_id', user.id).eq('status', 'draft');
  const { count: publishedCountRaw } = await db(supabase)
    .from('products').select('id', { count: 'exact' })
    .eq('supplier_id', user.id).eq('status', 'published');

  const counts = {
    total: usedCount,
    unpublished: unpublishedCountRaw ?? 0,
    published: publishedCountRaw ?? 0,
  };

  // Filter groups
  const filterGroups = [
    {
      key: 'status',
      label: tCommon('status'),
      options: [
        { value: 'published', label: tCommon('published') },
        { value: 'draft', label: t('unpublished') },
      ],
    },
  ];

  const sortOptions = [
    { value: 'newest', label: tCommon('createdAt') + ' ↓' },
    { value: 'oldest', label: tCommon('createdAt') + ' ↑' },
    { value: 'priceHigh', label: t('price') + ' ↓' },
    { value: 'priceLow', label: t('price') + ' ↑' },
  ];

  // Build serializable translations for the client component
  const translations = {
    name: t('name' as never) || 'Name',
    status: tCommon('status'),
    price: t('price'),
    stock: t('inStock'),
    outOfStock: t('outOfStock'),
    inStock: t('inStock'),
    created: tCommon('createdAt'),
    byVariants: t('byVariants'),
    actions: tCommon('actions'),
    delete: tCommon('delete'),
    unpublish: t('unpublish') || 'Unpublish',
    republish: t('republish') || 'Republish',
    editPrice: t('editPrice') || 'Edit Price',
    editStock: t('editStock') || 'Edit Stock',
    export: t('export') || 'Export',
    noProducts: t('noProducts'),
    addFirstProduct: t('addFirstProduct'),
    addProduct: t('addProduct'),
    inquiries: t('inquiriesLabel' as never) || 'Inquiries',
    selected: '{count} selected',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        action={
          <div className="flex items-center gap-3">
            <TierLimitIndicator current={usedCount} max={maxProducts} label={t('productCount')} />
            {atLimit ? (
              <Link href="/dashboard/subscription">
                <Button variant="outline" size="sm">
                  <AlertTriangle className="me-1.5 h-4 w-4 text-warning" />
                  {t('upgradeSubscription')}
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard/products/new">
                <Button>
                  <Plus className="me-2 h-4 w-4" />
                  {t('new')}
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* At-Limit Warning */}
      {atLimit && (
        <div className="flex items-center gap-3 rounded-lg border border-status-pending/30 bg-status-pending/10 p-4">
          <AlertTriangle className="h-5 w-5 text-status-pending" />
          <p className="text-sm text-status-pending">
            {t('atLimitWarning', { max: maxProducts })}{' '}
            <Badge variant={tier as 'starter' | 'pro' | 'business' | 'enterprise'}>{tier}</Badge>.
            {' '}
            <Link href="/dashboard/subscription" className="font-medium underline">
              {t('upgradeYourPlan')}
            </Link>
          </p>
        </div>
      )}

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<Package className="h-5 w-5 text-primary" />} label={tCommon('all')} value={counts.total} />
        <StatCard icon={<Package className="h-5 w-5 text-success" />} label={tCommon('published')} value={counts.published} color="green" />
        <StatCard icon={<EyeOff className="h-5 w-5 text-muted-foreground" />} label={t('unpublished')} value={counts.unpublished} />
      </div>

      {/* Products Table */}
      <ProductsTableClient
        items={items}
        locale={locale}
        totalCount={totalCount}
        currentPage={page}
        totalPages={totalPages}
        translations={translations}
        filterGroups={filterGroups}
        sortOptions={sortOptions}
      />
    </div>
  );
}
