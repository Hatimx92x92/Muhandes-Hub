// =============================================================================
// New Proof Page — Submit proof for a deal
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { ProofForm } from '@/components/forms/proof-form';
import { getTranslations, getLocale } from 'next-intl/server';
import { isUUID, getLocaleField } from '@/lib/utils';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function NewProofPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  let slug: string;
  try { slug = decodeURIComponent(rawSlug); } catch { slug = rawSlug; }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const locale = await getLocale();

  // Resolve deal by UUID or title_slug
  let deal;
  if (isUUID(slug)) {
    const { data } = await db(supabase).from('deals').select('id, buyer_id, seller_id, status, seller_progress, buyer_progress, title_slug, project_id').eq('id', slug).single();
    deal = data;
  } else {
    const { data } = await db(supabase).from('deals').select('id, buyer_id, seller_id, status, seller_progress, buyer_progress, title_slug, project_id').eq('title_slug', slug).single();
    deal = data;
  }

  if (!deal) notFound();
  const dealId = deal.id;
  const displaySlug = deal.title_slug || slug;

  const t = await getTranslations('dashboard.deals');

  // Fetch project title separately to avoid breaking the deal fetch
  const dealProject = deal.project_id
    ? (await db(supabase).from('projects').select('title_ar, title_en').eq('id', deal.project_id).maybeSingle()).data
    : null;

  if (deal.buyer_id !== user.id && deal.seller_id !== user.id) {
    redirect('/dashboard/deals');
  }
  if (!['active', 'in_progress'].includes(deal.status)) {
    redirect(`/dashboard/deals/${displaySlug}?tab=proofs`);
  }

  const userRole = deal.buyer_id === user.id ? 'buyer' : 'seller';
  const currentProgress = userRole === 'seller'
    ? Number(deal.seller_progress) || 0
    : Number(deal.buyer_progress) || 0;
  const maxPercentage = 100 - currentProgress;

  // Fetch milestones for linking
  const { data: milestones } = await db(supabase)
    .from('deal_milestones')
    .select('id, title_ar, title_en')
    .eq('deal_id', dealId)
    .eq('is_suggestion', false)
    .order('sort_order', { ascending: true });

  const milestoneItems = (milestones ?? []) as Array<{ id: string; title_ar: string; title_en?: string | null }>;

  return (
    <div className="space-y-6">
      <BreadcrumbOverride segment={dealId} label={getLocaleField(dealProject ?? {}, 'title', locale) || `#${dealId.slice(0, 8)}`} />
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('submitProof')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('submitProofDesc', { remaining: maxPercentage })}
        </p>
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
