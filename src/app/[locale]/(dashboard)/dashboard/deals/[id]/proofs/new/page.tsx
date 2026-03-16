// =============================================================================
// New Proof Page — Submit proof for a deal
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { ProofForm } from '@/components/forms/proof-form';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function NewProofPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: dealId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify deal exists and user is participant
  const { data: deal } = await db(supabase)
    .from('deals')
    .select('id, buyer_id, seller_id, status, seller_progress, buyer_progress')
    .eq('id', dealId)
    .single();

  if (!deal) notFound();

  const t = await getTranslations('dashboard.deals');

  if (deal.buyer_id !== user.id && deal.seller_id !== user.id) {
    redirect('/dashboard/deals');
  }
  if (!['active', 'in_progress'].includes(deal.status)) {
    redirect(`/dashboard/deals/${dealId}?tab=proofs`);
  }

  const userRole = deal.buyer_id === user.id ? 'buyer' : 'seller';
  const currentProgress = userRole === 'seller'
    ? Number(deal.seller_progress) || 0
    : Number(deal.buyer_progress) || 0;
  const maxPercentage = 100 - currentProgress;

  // Fetch milestones for linking
  const { data: milestones } = await db(supabase)
    .from('deal_milestones')
    .select('id, title_ar')
    .eq('deal_id', dealId)
    .eq('is_suggestion', false)
    .order('sort_order', { ascending: true });

  const milestoneItems = (milestones ?? []) as Array<{ id: string; title_ar: string }>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/deals/${dealId}?tab=proofs`}>
          <Button variant="ghost" size="sm">
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('submitProof')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('submitProofDesc', { remaining: maxPercentage })}
          </p>
        </div>
      </div>

      <Card className="p-6">
        <ProofForm
          dealId={dealId}
          milestones={milestoneItems}
          maxPercentage={maxPercentage}
        />
      </Card>
    </div>
  );
}
