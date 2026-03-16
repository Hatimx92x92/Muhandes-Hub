// =============================================================================
// Dashboard — New Product Page
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { ProductForm } from '@/components/forms/product-form';
import { TIER_LIMITS } from '@/types';
import { AlertTriangle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { getTranslations } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function NewProductPage() {
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

  // Tier limit pre-check
  const tier = profile.subscription_tier || 'starter';
  const limits = TIER_LIMITS[tier];
  const maxProducts = limits?.productPosts ?? 2;

  const { count } = await db(supabase)
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('supplier_id', user.id);

  if (maxProducts !== Infinity && (count ?? 0) >= maxProducts) {
    const t = await getTranslations('dashboard.products');
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('newPage.title')}</h1>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-status-pending/30 bg-status-pending/10 p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-status-pending" />
          <h2 className="text-lg font-semibold text-status-pending">
            {t('tierLimitReached')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('tierLimitDesc', { tier, max: maxProducts })}
          </p>
          <Link href="/dashboard/subscription">
            <Button>{t('upgradeSubscription')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const t = await getTranslations('dashboard.products');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('newPage.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('newPage.subtitle')}
        </p>
      </div>

      <Card className="p-6">
        <ProductForm mode="create" />
      </Card>
    </div>
  );
}
