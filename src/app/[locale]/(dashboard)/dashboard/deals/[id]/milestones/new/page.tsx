// =============================================================================
// New Milestone Page — Create a milestone for a deal
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { MilestoneForm } from '@/components/forms/milestone-form';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function NewMilestonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: dealId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify deal exists and user is buyer
  const { data: deal } = await db(supabase)
    .from('deals')
    .select('id, buyer_id, seller_id, status, value')
    .eq('id', dealId)
    .single();

  if (!deal) notFound();

  const t = await getTranslations('dashboard.deals');

  if (deal.buyer_id !== user.id) {
    redirect(`/dashboard/deals/${dealId}?tab=milestones`);
  }
  if (!['active', 'in_progress'].includes(deal.status)) {
    redirect(`/dashboard/deals/${dealId}?tab=milestones`);
  }

  // Get current milestone count for sort_order
  const { data: milestones } = await db(supabase)
    .from('deal_milestones')
    .select('id')
    .eq('deal_id', dealId)
    .eq('is_suggestion', false);

  const nextSortOrder = (milestones?.length ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/deals/${dealId}?tab=milestones`}>
          <Button variant="ghost" size="sm">
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('newMilestoneTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('newMilestoneDesc')}</p>
        </div>
      </div>

      <Card className="p-6">
        <MilestoneForm dealId={dealId} nextSortOrder={nextSortOrder} />
      </Card>
    </div>
  );
}
