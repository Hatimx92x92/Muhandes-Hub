// =============================================================================
// Dashboard — My Products List
// =============================================================================

import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PostStatusBadge } from '@/components/features/post-status-badge';
import { EmptyState } from '@/components/features/empty-state';
import { Plus, Package, AlertTriangle } from 'lucide-react';
import { formatSAR, getLocaleField } from '@/lib/utils';
import { TIER_LIMITS } from '@/types';
import { getTranslations, getLocale } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function ProductsListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Supplier only
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role, subscription_tier')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'supplier') {
    redirect('/dashboard');
  }

  const tier = profile.subscription_tier || 'starter';
  const limits = TIER_LIMITS[tier];
  const maxProducts = limits?.productPosts ?? 2;

  const t = await getTranslations('dashboard.products');
  const tCommon = await getTranslations('dashboard.common');
  const locale = await getLocale();

  // Fetch products
  const { data: products } = await db(supabase)
    .from('products')
    .select('id, name_ar, name_en, pricing_model, price, in_stock, status, created_at')
    .eq('supplier_id', user.id)
    .order('created_at', { ascending: false });

  const items = (products ?? []) as Array<{
    id: string;
    name_ar: string;
    name_en: string;
    pricing_model: string;
    price: number | null;
    in_stock: boolean;
    status: string;
    created_at: string;
  }>;

  const usedCount = items.length;
  const atLimit = maxProducts !== Infinity && usedCount >= maxProducts;

  // Status counts
  const counts = {
    total: items.length,
    draft: items.filter((p) => p.status === 'draft').length,
    pending: items.filter((p) => p.status === 'pending').length,
    published: items.filter((p) => p.status === 'published').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tier limit indicator */}
          <span className="text-sm text-muted-foreground">
            {maxProducts === Infinity
              ? `${usedCount} ${t('productCount')}`
              : `${usedCount} / ${maxProducts}`}
          </span>
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
      </div>

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label={tCommon('all')} count={counts.total} />
        <SummaryCard label={tCommon('draft')} count={counts.draft} variant="gray" />
        <SummaryCard label={tCommon('pending')} count={counts.pending} variant="yellow" />
        <SummaryCard label={tCommon('published')} count={counts.published} variant="green" />
      </div>

      {/* Products Grid */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title={t('noProducts')}
          description={t('addFirstProduct')}
          actionLabel={t('addProduct')}
          actionHref="/dashboard/products/new"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product Card
// ---------------------------------------------------------------------------
async function ProductCard({
  product,
}: {
  product: {
    id: string;
    name_ar: string;
    name_en: string;
    pricing_model: string;
    price: number | null;
    in_stock: boolean;
    status: string;
    created_at: string;
  };
}) {
  const t = await getTranslations('dashboard.products');
  const locale = await getLocale();
  const name = getLocaleField(product, 'name', locale);
  const validStatuses = ['draft', 'pending', 'published', 'rejected', 'awarded', 'completed', 'expired', 'closed'] as const;
  const status = validStatuses.includes(product.status as typeof validStatuses[number])
    ? (product.status as typeof validStatuses[number])
    : 'draft';

  return (
    <Link href={`/dashboard/products/${product.id}`}>
      <Card className="h-full p-4 transition-colors hover:bg-card/80">
        {/* Placeholder image */}
        <div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-muted">
          <Package className="h-10 w-10 text-muted-foreground/50" />
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{name}</h3>
            <PostStatusBadge status={status} showIcon={false} />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {product.pricing_model === 'fixed'
                ? product.price ? formatSAR(product.price) : '—'
                : t('byVariants')}
            </span>
            <span className={product.in_stock ? 'text-status-completed' : 'text-destructive'}>
              {product.in_stock ? t('inStock') : t('outOfStock')}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Summary Card
// ---------------------------------------------------------------------------
function SummaryCard({
  label,
  count,
  variant = 'default',
}: {
  label: string;
  count: number;
  variant?: 'default' | 'gray' | 'yellow' | 'green';
}) {
  const colors = {
    default: 'border-border',
    gray: 'border-border',
    yellow: 'border-status-pending/30',
    green: 'border-status-completed/30',
  };

  return (
    <Card className={`border ${colors[variant]} p-3 text-center`}>
      <div className="text-2xl font-bold text-foreground">{count}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}
