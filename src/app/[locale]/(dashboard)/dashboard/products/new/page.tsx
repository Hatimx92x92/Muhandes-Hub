// =============================================================================
// Dashboard — New Product Page
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { ProductForm } from '@/components/forms/product-form';
import { PageHeader } from '@/components/ui/page-header';
import { getEffectiveLimits } from '@/types';
import { getTranslations } from 'next-intl/server';
import { TierGate } from '@/components/features/tier-gate';

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
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'supplier') {
    redirect('/dashboard');
  }

  // Tier limit pre-check
  const { data: subscription } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const tier = (subscription?.tier || 'starter') as string;
  const limits = getEffectiveLimits('supplier', tier);
  const maxProducts = limits?.productPosts ?? 2;

  const { count } = await db(supabase)
    .from('products')
    .select('id', { count: 'exact' })
    .eq('supplier_id', user.id);

  if (maxProducts !== Infinity && (count ?? 0) >= maxProducts) {
    const t = await getTranslations('dashboard.products');
    const tGate = await getTranslations('tierGate');
    return (
      <div className="space-y-6">
        <PageHeader title={t('newPage.title')} backHref="/dashboard/products" />
        <TierGate
          isLocked
          title={tGate('productPosts.title')}
          description={tGate('productPosts.description', { tier })}
          upgradeLabel={tGate('upgrade')}
          variant="limit"
          mode="inline"
        />
      </div>
    );
  }

  const t = await getTranslations('dashboard.products');

  return (
    <div className="space-y-6">
      <PageHeader title={t('newPage.title')} description={t('newPage.subtitle')} backHref="/dashboard/products" />

      <Card className="p-6">
        <ProductForm mode="create" />
      </Card>
    </div>
  );
}
