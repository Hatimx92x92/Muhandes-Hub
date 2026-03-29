// =============================================================================
// Dashboard — My Products List
// =============================================================================

import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PostStatusBadge } from '@/components/features/post-status-badge';
import { EmptyState } from '@/components/features/empty-state';
import { TierLimitIndicator } from '@/components/features/tier-gate';
import { Plus, Package, AlertTriangle } from 'lucide-react';
import { formatSAR, getLocaleField } from '@/lib/utils';
import { TIER_LIMITS } from '@/types';
import { getTranslations, getLocale } from 'next-intl/server';
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

export default async function ProductsListPage() {
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
  const locale = await getLocale();

  // Fetch products with inquiry counts
  const { data: products } = await db(supabase)
    .from('products')
    .select('id, name_ar, name_en, pricing_model, price, in_stock, status, created_at, inquiries(count)')
    .eq('supplier_id', user.id)
    .order('created_at', { ascending: false });

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

  const usedCount = items.length;
  const atLimit = maxProducts !== Infinity && usedCount >= maxProducts;

  // Status counts
  const counts = {
    total: items.length,
    draft: items.filter((p) => p.status === 'draft').length,
    pending: items.filter((p) => p.status === 'pending').length,
    published: items.filter((p) => p.status === 'published').length,
  };

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
    submitForReview: t('detail.submitForReview' as never) || 'Submit for Review',
    noProducts: t('noProducts'),
    addFirstProduct: t('addFirstProduct'),
    addProduct: t('addProduct'),
    inquiries: t('inquiriesLabel' as never) || 'Inquiries',
    selected: '{count} selected',
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

      {/* Products Table */}
      <ProductsTableClient items={items} locale={locale} translations={translations} />
    </div>
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
