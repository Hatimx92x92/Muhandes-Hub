// =============================================================================
// Create Contract Page — Dashboard
// =============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { ContractForm } from '@/components/forms/contract-form';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any { return supabase; }

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ deal_id?: string }>;
}) {
  const { deal_id } = await searchParams;
  const t = await getTranslations('dashboard.contracts');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get user profile for auto-fill
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('full_name_ar, full_name_en, company_name_ar, company_name_en, cr_number, vat_number, phone, email, city')
    .eq('id', user.id)
    .single();

  // Get user's clause library
  const { data: clauses } = await db(supabase)
    .from('contract_clauses')
    .select('*')
    .eq('user_id', user.id)
    .order('category', { ascending: true });

  // If deal-linked, fetch deal + counterparty info
  let dealInfo = null;
  if (deal_id) {
    const { data: deal } = await db(supabase)
      .from('deals')
      .select('id, buyer_id, seller_id, value, trigger_source')
      .eq('id', deal_id)
      .single();

    if (deal) {
      const counterpartyId = deal.buyer_id === user.id ? deal.seller_id : deal.buyer_id;
      const { data: counterparty } = await db(supabase)
        .from('profiles')
        .select('full_name_ar, company_name_ar, company_name_en, cr_number, vat_number, phone, email')
        .eq('id', counterpartyId)
        .single();

      dealInfo = { deal, counterparty };
    }
  }

  const profileData = profile ?? {};
  const clauseItems = (clauses ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('newPage.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {deal_id ? t('newPage.linkedToDeal') : t('newPage.standalone')}
        </p>
      </div>

      <Card className="p-6">
        <ContractForm
          dealId={deal_id}
          profile={profileData as Record<string, unknown>}
          dealInfo={dealInfo as { deal: Record<string, unknown>; counterparty: Record<string, unknown> } | null}
          clauses={clauseItems}
        />
      </Card>
    </div>
  );
}
