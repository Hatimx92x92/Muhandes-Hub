// =============================================================================
// Deal Detail / Workspace Page — Server data-fetcher delegates to client
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isUUID, getLocaleField, getEntitySlug } from '@/lib/utils';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';
import { DealWorkspace } from '@/components/features/deals/deal-workspace';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function DealDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale, slug: rawSlug } = await params;
  setRequestLocale(locale);
  const { tab = 'overview' } = await searchParams;

  // Decode URI-encoded slugs (Arabic characters get percent-encoded by browsers)
  let slug: string;
  try { slug = decodeURIComponent(rawSlug); } catch { slug = rawSlug; }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.deals');

  // -----------------------------------------------------------------------
  // Resolve deal by UUID or title_slug
  // -----------------------------------------------------------------------
  let deal;
  if (isUUID(slug)) {
    const { data } = await db(supabase).from('deals').select('*').eq('id', slug).single();
    deal = data;
  } else {
    const { data } = await db(supabase).from('deals').select('*').eq('title_slug', slug).single();
    deal = data;
  }

  if (!deal) notFound();

  const id = deal.id;
  const displaySlug = deal.title_slug || slug;

  // Verify participant
  if (deal.buyer_id !== user.id && deal.seller_id !== user.id) {
    redirect('/dashboard/deals');
  }

  const userRole = deal.buyer_id === user.id ? 'buyer' : 'seller';

  // -----------------------------------------------------------------------
  // Parallel data fetching
  // -----------------------------------------------------------------------
  const [
    { data: milestones },
    { data: proofs },
    { data: activities },
    { data: cancelRequests },
    { data: skipRequests },
    { data: buyerProfile },
    { data: sellerProfile },
    { data: documents },
    { data: dealProject },
  ] = await Promise.all([
    db(supabase)
      .from('deal_milestones')
      .select('*')
      .eq('deal_id', id)
      .order('sort_order', { ascending: true }),
    db(supabase)
      .from('deal_proofs')
      .select('*')
      .eq('deal_id', id)
      .order('created_at', { ascending: false }),
    db(supabase)
      .from('deal_activity_log')
      .select('*, actor:profiles!deal_activity_log_actor_id_fkey(full_name, avatar_url)')
      .eq('deal_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
    db(supabase)
      .from('deal_cancel_requests')
      .select('*')
      .eq('deal_id', id)
      .order('created_at', { ascending: false }),
    db(supabase)
      .from('deal_skip_requests')
      .select('*')
      .eq('deal_id', id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    db(supabase)
      .from('profiles')
      .select('full_name, avatar_url, role, slug_ar, slug_en')
      .eq('id', deal.buyer_id)
      .single(),
    db(supabase)
      .from('profiles')
      .select('full_name, avatar_url, role, slug_ar, slug_en')
      .eq('id', deal.seller_id)
      .single(),
    db(supabase)
      .from('deal_documents')
      .select('id, category, file_url, file_name, file_size, mime_type, notes, created_at, uploader:profiles!deal_documents_uploader_id_fkey(full_name)')
      .eq('deal_id', id)
      .order('created_at', { ascending: false }),
    deal.project_id
      ? db(supabase).from('projects').select('title_ar, title_en').eq('id', deal.project_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Actual platform role of the current user (contractor/supplier/buyer/project_owner)
  const userPlatformRole: string =
    userRole === 'buyer'
      ? (buyerProfile?.role ?? 'buyer')
      : (sellerProfile?.role ?? 'contractor');

  // -----------------------------------------------------------------------
  // Review eligibility (completed deals only)
  // -----------------------------------------------------------------------
  let hasReviewed = false;
  let canReview = false;
  let daysRemaining = 0;
  if (deal.status === 'completed' && deal.completed_at) {
    const { data: existingReview } = await db(supabase)
      .from('reviews')
      .select('id')
      .eq('deal_id', id)
      .eq('reviewer_id', user.id)
      .maybeSingle();
    hasReviewed = !!existingReview;
    const completedDate = new Date(deal.completed_at);
    const thirtyDaysLater = new Date(completedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    daysRemaining = Math.max(0, Math.ceil((thirtyDaysLater.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
    canReview = !hasReviewed && daysRemaining > 0;
  }

  // -----------------------------------------------------------------------
  // Deal origin source resolution
  // -----------------------------------------------------------------------
  let sourceInfo: { type: string; label: string; href: string } | null = null;
  const triggerSource = deal.trigger_source as string | null;

  if (triggerSource === 'bid_award' && deal.bid_id) {
    const { data: bid } = await db(supabase)
      .from('bids')
      .select('project_id, projects(title_ar, title_en, slug_ar, slug_en)')
      .eq('id', deal.bid_id)
      .single();
    if (bid?.projects) {
      const projectName = getLocaleField(bid.projects, 'title', locale);
      const projectSlug = getEntitySlug(bid.projects, locale);
      sourceInfo = { type: 'project', label: projectName, href: `/dashboard/projects/${projectSlug || bid.project_id}` };
    }
  } else if (triggerSource === 'inquiry_quotation' && deal.quotation_id) {
    const { data: qtn } = await db(supabase)
      .from('quotations')
      .select('number')
      .eq('id', deal.quotation_id)
      .single();
    sourceInfo = {
      type: 'quotation',
      label: qtn?.number ?? `#${(deal.quotation_id as string).slice(0, 8)}`,
      href: `/dashboard/quotations/${deal.quotation_id}`,
    };
  } else if (triggerSource === 'rfq_response' && deal.rfq_response_id) {
    const { data: resp } = await db(supabase)
      .from('rfq_responses')
      .select('rfq_id, rfqs(title_ar, title_en, slug_ar, slug_en)')
      .eq('id', deal.rfq_response_id)
      .single();
    if (resp?.rfqs) {
      const rfqName = getLocaleField(resp.rfqs, 'title', locale);
      const rfqSlug = getEntitySlug(resp.rfqs, locale);
      sourceInfo = { type: 'rfq', label: rfqName, href: `/dashboard/rfqs/${rfqSlug || resp.rfq_id}` };
    }
  }

  // -----------------------------------------------------------------------
  // Linked contracts
  // -----------------------------------------------------------------------
  const { data: contracts } = await db(supabase)
    .from('contracts')
    .select('id, template_type, status, created_at')
    .eq('deal_id', id)
    .order('created_at', { ascending: false });

  // -----------------------------------------------------------------------
  // Prepare data for client component
  // -----------------------------------------------------------------------
  const milestoneItems = (milestones ?? []) as Array<Record<string, unknown>>;
  const realMilestones = milestoneItems.filter(m => !m.is_suggestion);
  const suggestions = milestoneItems.filter(m => m.is_suggestion && !m.suggestion_approved);
  const cancelItems = (cancelRequests ?? []) as Array<Record<string, unknown>>;
  const pendingCancelRequest = cancelItems.find(r => r.status === 'pending');
  const pendingSkipRequests = (skipRequests ?? []) as Array<Record<string, unknown>>;

  return (
    <>
      <BreadcrumbOverride segment={slug} label={getLocaleField(dealProject as Record<string, unknown> ?? {}, 'title', locale) || sourceInfo?.label || deal.title_slug || `${t('dealPrefix')} #${id.slice(0, 8)}`} />
      <DealWorkspace
        deal={{ ...deal, project: dealProject }}
        userRole={userRole as 'buyer' | 'seller'}
        userPlatformRole={userPlatformRole}
        userId={user.id}
        milestones={realMilestones}
        suggestions={suggestions}
        proofs={(proofs ?? []) as Array<Record<string, unknown>>}
        activities={(activities ?? []) as Array<Record<string, unknown>>}
        pendingCancelRequest={pendingCancelRequest}
        pendingSkipRequests={pendingSkipRequests}
        documents={(documents ?? []) as Array<{
          id: string;
          category: string;
          file_url: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          notes: string | null;
          created_at: string;
          uploader: { full_name: string } | null;
        }>}
        hasReviewed={hasReviewed}
        canReview={canReview}
        daysRemaining={daysRemaining}
        buyerProfile={buyerProfile}
        sellerProfile={sellerProfile}
        displaySlug={displaySlug}
        initialTab={tab}
        sourceInfo={sourceInfo}
        contracts={(contracts ?? []) as Array<{ id: string; template_type: string; status: string; created_at: string }>}
      />
    </>
  );
}
