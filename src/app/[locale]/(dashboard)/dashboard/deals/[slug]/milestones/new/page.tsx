// =============================================================================
// New Milestone Page — Create a milestone for a deal
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { MilestoneForm } from '@/components/forms/milestone-form';
import { getTranslations } from 'next-intl/server';
import { isUUID } from '@/lib/utils';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function NewMilestonePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Resolve deal by UUID or title_slug
  let deal;
  if (isUUID(slug)) {
    const { data } = await db(supabase).from('deals').select('id, buyer_id, seller_id, status, value, title_slug').eq('id', slug).single();
    deal = data;
  } else {
    const { data } = await db(supabase).from('deals').select('id, buyer_id, seller_id, status, value, title_slug').eq('title_slug', slug).single();
    deal = data;
  }

  if (!deal) notFound();
  const dealId = deal.id;
  const displaySlug = deal.title_slug || slug;

  const t = await getTranslations('dashboard.deals');

  if (deal.buyer_id !== user.id) {
    redirect(`/dashboard/deals/${displaySlug}?tab=milestones`);
  }
  if (!['active', 'in_progress'].includes(deal.status)) {
    redirect(`/dashboard/deals/${displaySlug}?tab=milestones`);
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
      <BreadcrumbOverride segment={dealId} label={`#${dealId.slice(0, 8)}`} />
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('newMilestoneTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('newMilestoneDesc')}</p>
      </div>

      <Card className="p-6">
        <MilestoneForm dealId={dealId} nextSortOrder={nextSortOrder} />
      </Card>
    </div>
  );
}
