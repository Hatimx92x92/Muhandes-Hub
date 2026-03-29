// =============================================================================
// New Quotation Page — Dashboard
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { QuotationForm } from '@/components/forms/quotation-form';
import { getTranslations } from 'next-intl/server';
import { TIER_LIMITS } from '@/types';
import { TierGate } from '@/components/features/tier-gate';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ inquiry_id?: string; recipient_id?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Only contractor or supplier can create quotations
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['contractor', 'supplier'].includes(profile.role)) {
    redirect('/dashboard');
  }

  // Tier limit check
  const { data: subscription } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const tier = (subscription?.tier || 'starter') as keyof typeof TIER_LIMITS;
  const limits = TIER_LIMITS[tier];
  const maxQuotations = limits?.quotationsPerMonth ?? 3;

  if (maxQuotations !== Infinity) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count } = await db(supabase)
      .from('quotations')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .gte('created_at', startOfMonth);

    if ((count ?? 0) >= maxQuotations) {
      const t = await getTranslations('dashboard.quotations');
      const tGate = await getTranslations('tierGate');
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('newPage.title')}</h1>
          </div>
          <TierGate
            isLocked
            title={tGate('quotationsPerMonth.title')}
            description={tGate('quotationsPerMonth.description', { tier })}
            upgradeLabel={tGate('upgrade')}
            variant="limit"
            mode="inline"
          />
        </div>
      );
    }
  }

  const t = await getTranslations('dashboard.quotations');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('newPage.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('newPage.subtitle')}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <QuotationForm
          mode={params.mode === 'inquiry_response' ? 'inquiry_response' : 'standalone'}
          inquiryId={params.inquiry_id}
          recipientId={params.recipient_id}
        />
      </div>
    </div>
  );
}
