// =============================================================================
// Dashboard — Submit Bid on Project
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { BidForm } from '@/components/forms/bid-form';
import { getTranslations, getLocale } from 'next-intl/server';
import { getLocaleField, isUUID, getEntitySlug } from '@/lib/utils';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';
import { TIER_LIMITS } from '@/types';
import { TierGate } from '@/components/features/tier-gate';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function SubmitBidPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const locale = await getLocale();

  // Verify user is a contractor
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'contractor') {
    const tCommon = await getTranslations('dashboard.common');
    const tBids = await getTranslations('dashboard.bids');
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <Card className="p-8">
          <h1 className="text-xl font-bold text-foreground">{tCommon('unauthorized')}</h1>
          <p className="mt-2 text-muted-foreground">{tBids('onlyContractors')}</p>
          <Link href={`/projects/${slug}`} className="mt-4 inline-block text-sm text-primary hover:underline">
            {tBids('backToProjectDetails')}
          </Link>
        </Card>
      </div>
    );
  }

  // Tier limit check — bidsPerMonth
  const { data: sub } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const tier = (sub?.tier || 'starter') as keyof typeof TIER_LIMITS;
  const maxBids = TIER_LIMITS[tier]?.bidsPerMonth ?? 10;

  if (maxBids !== Infinity) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count: bidCount } = await db(supabase)
      .from('bids')
      .select('id', { count: 'exact', head: true })
      .eq('contractor_id', user.id)
      .gte('submitted_at', startOfMonth);

    if ((bidCount ?? 0) >= maxBids) {
      const tGate = await getTranslations('tierGate');
      return (
        <div className="mx-auto max-w-2xl py-12">
          <TierGate
            isLocked
            title={tGate('bidsPerMonth.title')}
            description={tGate('bidsPerMonth.description', { tier })}
            upgradeLabel={tGate('upgrade')}
            variant="limit"
          />
        </div>
      );
    }
  }

  // Resolve project by slug or UUID
  let project;
  if (isUUID(slug)) {
    const { data } = await db(supabase)
      .from('projects')
      .select('id, title_ar, title_en, status, budget_min, budget_max, slug_ar, slug_en')
      .eq('id', slug)
      .eq('status', 'published')
      .single();
    project = data;
  } else {
    const slugCol = locale === 'ar' ? 'slug_ar' : 'slug_en';
    let { data } = await db(supabase)
      .from('projects')
      .select('id, title_ar, title_en, status, budget_min, budget_max, slug_ar, slug_en')
      .eq(slugCol, slug)
      .eq('status', 'published')
      .single();
    if (!data) {
      const fallbackCol = locale === 'ar' ? 'slug_en' : 'slug_ar';
      ({ data } = await db(supabase)
        .from('projects')
        .select('id, title_ar, title_en, status, budget_min, budget_max, slug_ar, slug_en')
        .eq(fallbackCol, slug)
        .eq('status', 'published')
        .single());
    }
    project = data;
  }

  if (!project) notFound();

  // Check if already bid
  const { data: existingBid } = await db(supabase)
    .from('bids')
    .select('id')
    .eq('project_id', project.id)
    .eq('contractor_id', user.id)
    .single();

  if (existingBid) {
    const tBids = await getTranslations('dashboard.bids');
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <Card className="p-8">
          <h1 className="text-xl font-bold text-foreground">{tBids('alreadySubmitted')}</h1>
          <p className="mt-2 text-muted-foreground">{tBids('alreadySubmittedDesc')}</p>
          <Link href={`/projects/${slug}`} className="mt-4 inline-block text-sm text-primary hover:underline">
            {tBids('backToProjectDetails')}
          </Link>
        </Card>
      </div>
    );
  }

  const tBids = await getTranslations('dashboard.bids');
  const tDetail = await getTranslations('dashboard.projects.detail');

  return (
    <div className="mx-auto max-w-2xl py-8">
      <BreadcrumbOverride segment={slug} label={getLocaleField(project, 'title', locale)} />

      <h1 className="mb-6 text-2xl font-bold text-foreground">{tBids('submitBid')}</h1>

      <BidForm
        projectId={project.id}
        projectTitle={getLocaleField(project, 'title', locale)}
      />
    </div>
  );
}
