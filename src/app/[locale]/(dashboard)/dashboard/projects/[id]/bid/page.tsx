// =============================================================================
// Dashboard — Submit Bid on Project
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { BidForm } from '@/components/forms/bid-form';
import { ArrowRight } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';
import { getLocaleField } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function SubmitBidPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

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
          <Link href={`/projects/${id}`} className="mt-4 inline-block text-sm text-primary hover:underline">
            {tBids('backToProjectDetails')}
          </Link>
        </Card>
      </div>
    );
  }

  // Fetch project
  const { data: project } = await db(supabase)
    .from('projects')
    .select('id, title_ar, title_en, status, budget_min, budget_max')
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (!project) notFound();

  // Check if already bid
  const { data: existingBid } = await db(supabase)
    .from('bids')
    .select('id')
    .eq('project_id', id)
    .eq('contractor_id', user.id)
    .single();

  if (existingBid) {
    const tBids = await getTranslations('dashboard.bids');
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <Card className="p-8">
          <h1 className="text-xl font-bold text-foreground">{tBids('alreadySubmitted')}</h1>
          <p className="mt-2 text-muted-foreground">{tBids('alreadySubmittedDesc')}</p>
          <Link href={`/projects/${id}`} className="mt-4 inline-block text-sm text-primary hover:underline">
            {tBids('backToProjectDetails')}
          </Link>
        </Card>
      </div>
    );
  }

  const tBids = await getTranslations('dashboard.bids');
  const tDetail = await getTranslations('dashboard.projects.detail');
  const locale = await getLocale();

  return (
    <div className="mx-auto max-w-2xl py-8">
      <Link
        href={`/projects/${id}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        {tDetail('backToProject')}
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-foreground">{tBids('submitBid')}</h1>

      <BidForm
        projectId={id}
        projectTitle={getLocaleField(project, 'title', locale)}
      />
    </div>
  );
}
