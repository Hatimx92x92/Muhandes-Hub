// =============================================================================
// New Quotation Page — Dashboard
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { QuotationForm } from '@/components/forms/quotation-form';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';
import { getEffectiveLimits } from '@/types';
import { TierGate } from '@/components/features/tier-gate';
import { getLocaleField } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function NewQuotationPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ inquiry_id?: string; recipient_id?: string; mode?: string }>;
}) {
  const { locale } = await routeParams;
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

  const tier = (subscription?.tier || 'starter') as string;
  const limits = getEffectiveLimits(profile.role, tier);
  const maxQuotations = limits?.quotationsPerMonth ?? 3;

  if (maxQuotations !== Infinity) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count } = await db(supabase)
      .from('quotations')
      .select('id', { count: 'exact' })
      .eq('sender_id', user.id)
      .gte('created_at', startOfMonth);

    if ((count ?? 0) >= maxQuotations) {
      const t = await getTranslations('dashboard.quotations');
      const tGate = await getTranslations('tierGate');
      return (
        <div className="space-y-6">
          <PageHeader title={t('newPage.title')} backHref="/dashboard/quotations" />
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

  // Pre-fill client name from recipient profile when responding to an inquiry
  let clientName: string | undefined;
  if (params.recipient_id) {
    const { data: recipientProfile } = await db(supabase)
      .from('profiles')
      .select('full_name_ar, full_name_en, company_name_ar, company_name_en')
      .eq('id', params.recipient_id)
      .single();

    if (recipientProfile) {
      clientName =
        getLocaleField(recipientProfile, 'company_name', locale) ||
        getLocaleField(recipientProfile, 'full_name', locale) ||
        undefined;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('newPage.title')} description={t('newPage.subtitle')} backHref="/dashboard/quotations" />
      <Card className="p-6">
        <QuotationForm
          mode={params.mode === 'inquiry_response' ? 'inquiry_response' : 'standalone'}
          inquiryId={params.inquiry_id}
          recipientId={params.recipient_id}
          defaultValues={{ client_name: clientName }}
        />
      </Card>
    </div>
  );
}
