// =============================================================================
// Muhandes HUB â€” Bid Server Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';
import { localizeFieldErrors } from '@/lib/zod-i18n';
import { BidSchema, UpdateBidSchema } from '@/schemas/bid';
import { bidLimiter, checkRateLimit } from '@/lib/rate-limit';
import { notifyBidReceived, notifyBidAwarded, notifyBidRejected, notifyBidShortlisted, notifyDealCreated } from '@/actions/notification-triggers';
import { autoLinkClient } from '@/actions/crm';
import type { ActionResult } from '@/types';
import { TIER_LIMITS, VAT_RATE } from '@/types';
import { slugify } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: Awaited<ReturnType<typeof createClient>>): any {
  return supabase;
}

async function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Promise<Record<string, string[]>> {
  const locale = await getLocale();
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? 'form');
    fieldErrors[key] = fieldErrors[key] ?? [];
    fieldErrors[key].push(issue.message);
  }
  return localizeFieldErrors(fieldErrors, locale);
}

// Commission rates by tier
const COMMISSION_RATES: Record<string, number> = {
  starter: 0.02,
  pro: 0.01,
  business: 0,
  enterprise: 0,
};

// ---------------------------------------------------------------------------
// SUBMIT BID
// ---------------------------------------------------------------------------
export async function submitBid(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.bids');

  // 1. Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // 1.5. Rate limit check (20 per hour per user)
  const rl = await checkRateLimit(bidLimiter(), `bid:${user.id}`);
  if (!rl.success) {
    return { data: null, error: t('tooManyAttempts') };
  }

  // 2. Role check â€” contractor only
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'contractor') {
    return { data: null, error: t('contractorsOnly') };
  }

  // 3. Tier limit check (monthly bid count)
  const { data: subscription } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const tier = (subscription?.tier || 'starter') as keyof typeof TIER_LIMITS;
  const monthlyLimit = TIER_LIMITS[tier]?.bidsPerMonth ?? 10;

  if (monthlyLimit !== Infinity) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await db(supabase)
      .from('bids')
      .select('id', { count: 'exact', head: true })
      .eq('contractor_id', user.id)
      .gte('submitted_at', startOfMonth.toISOString());

    if ((count ?? 0) >= monthlyLimit) {
      return { data: null, error: t('monthlyLimitReached', { limit: monthlyLimit }) };
    }
  }

  // 4. Parse form data
  const raw = {
    project_id: formData.get('project_id'),
    amount: formData.get('amount'),
    timeline_days: formData.get('timeline_days'),
    methodology_ar: formData.get('methodology_ar') || '',
    methodology_en: formData.get('methodology_en') || '',
  };

  // 5. Validate
  const parsed = BidSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: await toFieldErrors(parsed.error.issues) };
  }

  // 6. Verify project is published
  const { data: project } = await db(supabase)
    .from('projects')
    .select('id, status, classification, owner_id')
    .eq('id', parsed.data.project_id)
    .single();

  if (!project || project.status !== 'published') {
    return { data: null, error: t('projectNotAvailable') };
  }

  // Cannot bid on own project
  if (project.owner_id === user.id) {
    return { data: null, error: t('cannotBidOwnProject') };
  }

  // 7. Classification check (contractor classification >= project classification)
  if (project.classification && profile.classification) {
    const classOrder = { a: 3, b: 2, c: 1 } as Record<string, number>;
    const projectLevel = classOrder[project.classification] || 0;
    const contractorLevel = classOrder[profile.classification] || 0;
    if (contractorLevel < projectLevel) {
      return { data: null, error: t('insufficientClassification') };
    }
  }

  // 8. Check no existing bid on same project
  const { data: existingBid } = await db(supabase)
    .from('bids')
    .select('id')
    .eq('project_id', parsed.data.project_id)
    .eq('contractor_id', user.id)
    .single();

  if (existingBid) {
    return { data: null, error: t('alreadyBid') };
  }

  // 9. Insert bid
  const { data: bid, error } = await db(supabase)
    .from('bids')
    .insert({
      project_id: parsed.data.project_id,
      contractor_id: user.id,
      amount: parsed.data.amount,
      timeline_days: parsed.data.timeline_days,
      methodology_ar: parsed.data.methodology_ar || null,
      methodology_en: parsed.data.methodology_en || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !bid) {
    return { data: null, error: t('submitError') };
  }

  // Trigger bid_received notification to project owner
  notifyBidReceived({
    ownerId: project.owner_id,
    projectTitle: { ar: project.title_ar || '', en: project.title_en || '' },
    bidderName: user.user_metadata?.full_name || '',
    projectId: parsed.data.project_id,
    bidId: bid.id,
  }).catch(() => { /* fire-and-forget */ });

  revalidatePath(`/projects/${parsed.data.project_id}`);
  revalidatePath('/dashboard/projects');
  return { data: { id: bid.id }, error: null };
}

// ---------------------------------------------------------------------------
// UPDATE BID (pending only)
// ---------------------------------------------------------------------------
export async function updateBid(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.bids');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const raw = {
    bid_id: formData.get('bid_id'),
    amount: formData.get('amount'),
    timeline_days: formData.get('timeline_days'),
    methodology_ar: formData.get('methodology_ar') || '',
    methodology_en: formData.get('methodology_en') || '',
  };

  const parsed = UpdateBidSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: await toFieldErrors(parsed.error.issues) };
  }

  // Verify ownership and pending status
  const { data: bid } = await db(supabase)
    .from('bids')
    .select('id, contractor_id, project_id, status')
    .eq('id', parsed.data.bid_id)
    .single();

  if (!bid || bid.contractor_id !== user.id) {
    return { data: null, error: t('bidNotFound') };
  }

  if (bid.status !== 'pending') {
    return { data: null, error: t('cannotEditNonPending') };
  }

  const { error } = await db(supabase)
    .from('bids')
    .update({
      amount: parsed.data.amount,
      timeline_days: parsed.data.timeline_days,
      methodology_ar: parsed.data.methodology_ar || null,
      methodology_en: parsed.data.methodology_en || null,
    })
    .eq('id', parsed.data.bid_id);

  if (error) return { data: null, error: t('updateError') };

  revalidatePath(`/projects/${bid.project_id}`);
  return { data: { id: parsed.data.bid_id }, error: null };
}

// ---------------------------------------------------------------------------
// SHORTLIST BID (project owner)
// ---------------------------------------------------------------------------
export async function shortlistBid(bidId: string): Promise<ActionResult<{ status: string }>> {
  const t = await getTranslations('actions.bids');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Fetch bid + project for ownership check
  const { data: bid } = await db(supabase)
    .from('bids')
    .select('id, project_id, status, contractor_id')
    .eq('id', bidId)
    .single();

  if (!bid) return { data: null, error: t('bidNotFound') };

  const { data: project } = await db(supabase)
    .from('projects')
    .select('owner_id')
    .eq('id', bid.project_id)
    .single();

  if (!project || project.owner_id !== user.id) {
    return { data: null, error: t('unauthorized') };
  }

  if (bid.status !== 'pending') {
    return { data: null, error: t('cannotShortlistNonPending') };
  }

  const { error } = await db(supabase)
    .from('bids')
    .update({ status: 'shortlisted' })
    .eq('id', bidId);

  if (error) return { data: null, error: t('genericError') };

  // Trigger bid_shortlisted notification to contractor
  const { data: shortProject } = await db(supabase)
    .from('projects')
    .select('title_ar, title_en')
    .eq('id', bid.project_id)
    .single();

  notifyBidShortlisted({
    contractorId: bid.contractor_id,
    projectTitle: { ar: shortProject?.title_ar || '', en: shortProject?.title_en || '' },
    projectId: bid.project_id,
    bidId: bidId,
  }).catch(() => {});

  revalidatePath(`/dashboard/projects/${bid.project_id}/bids`);
  return { data: { status: 'shortlisted' }, error: null };
}

// ---------------------------------------------------------------------------
// AWARD BID â†’ create DEAL-PROJECT
// ---------------------------------------------------------------------------
export async function awardBid(bidId: string): Promise<ActionResult<{ bidId: string; dealId: string }>> {
  const t = await getTranslations('actions.bids');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Fetch bid + project
  const { data: bid } = await db(supabase)
    .from('bids')
    .select('id, project_id, contractor_id, amount, status')
    .eq('id', bidId)
    .single();

  if (!bid) return { data: null, error: t('bidNotFound') };
  if (bid.status !== 'pending' && bid.status !== 'shortlisted') {
    return { data: null, error: t('cannotAwardBidStatus') };
  }

  const { data: project } = await db(supabase)
    .from('projects')
    .select('id, owner_id, title_ar')
    .eq('id', bid.project_id)
    .single();

  if (!project || project.owner_id !== user.id) {
    return { data: null, error: t('unauthorized') };
  }

  // Get contractor tier for commission calculation (use admin to bypass RLS)
  const admin = createAdminClient();
  const { data: contractorSub } = await db(admin)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', bid.contractor_id)
    .eq('is_active', true)
    .single();

  const tier = contractorSub?.tier || 'starter';
  const commissionRate = COMMISSION_RATES[tier] ?? 0.02;
  const commissionAmount = bid.amount * commissionRate;
  const commissionVat = commissionAmount * VAT_RATE; // ZATCA 15%

  // 1. Award bid
  const { error: awardError } = await db(supabase)
    .from('bids')
    .update({ status: 'awarded' })
    .eq('id', bidId);

  if (awardError) return { data: null, error: t('awardError') };

  // 2. Reject all other bids on this project
  await db(supabase)
    .from('bids')
    .update({ status: 'rejected' })
    .eq('project_id', bid.project_id)
    .neq('id', bidId)
    .in('status', ['pending', 'shortlisted']);

  // 3. Update project status to awarded
  await db(supabase)
    .from('projects')
    .update({ status: 'awarded' })
    .eq('id', bid.project_id);

  // 4. Create DEAL-PROJECT
  const { data: deal, error: dealError } = await db(supabase)
    .from('deals')
    .insert({
      title_slug: slugify(`deal-${project.title_ar?.slice(0, 30) || bid.project_id}`),
      deal_type: 'deal_project',
      trigger_source: 'bid_award',
      bid_id: bidId,
      project_id: bid.project_id,
      seller_id: bid.contractor_id,
      buyer_id: user.id,
      value: bid.amount,
      commission_rate: commissionRate * 100, // store as percentage
      commission_amount: commissionAmount,
      commission_vat: commissionVat,
      status: 'active',
    })
    .select('id')
    .single();

  if (dealError || !deal) {
    return { data: null, error: t('dealCreationError') };
  }

  // Trigger notifications: bid_awarded to winner, bid_rejected to others, deal_created
  notifyBidAwarded({
    contractorId: bid.contractor_id,
    projectTitle: { ar: project.title_ar || '', en: project.title_en || '' },
    projectId: bid.project_id,
    bidId: bidId,
  }).catch(() => {});

  notifyDealCreated({
    userIds: [user.id, bid.contractor_id],
    dealNumber: deal.id.slice(0, 8),
    dealId: deal.id,
  }).catch(() => {});

  // Notify rejected bidders
  const { data: rejectedBids } = await db(supabase)
    .from('bids')
    .select('id, contractor_id')
    .eq('project_id', bid.project_id)
    .eq('status', 'rejected')
    .neq('id', bidId);

  if (rejectedBids) {
    for (const rb of rejectedBids) {
      notifyBidRejected({
        contractorId: rb.contractor_id,
        projectTitle: { ar: project.title_ar || '', en: project.title_en || '' },
        bidId: rb.id,
      }).catch(() => {});
    }
  }

  // Auto-link counterparty as CRM client
  autoLinkClient(deal.id).catch(() => {});

  revalidatePath(`/dashboard/projects/${bid.project_id}`);
  revalidatePath(`/dashboard/projects/${bid.project_id}/bids`);
  revalidatePath('/dashboard/deals');
  return { data: { bidId, dealId: deal.id }, error: null };
}

// ---------------------------------------------------------------------------
// REJECT BID (project owner)
// ---------------------------------------------------------------------------
export async function rejectBid(
  bidId: string,
  reasonAr?: string,
  reasonEn?: string,
): Promise<ActionResult<{ status: string }>> {
  const t = await getTranslations('actions.bids');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { data: bid } = await db(supabase)
    .from('bids')
    .select('id, project_id, status')
    .eq('id', bidId)
    .single();

  if (!bid) return { data: null, error: t('bidNotFound') };

  const { data: project } = await db(supabase)
    .from('projects')
    .select('owner_id')
    .eq('id', bid.project_id)
    .single();

  if (!project || project.owner_id !== user.id) {
    return { data: null, error: t('unauthorized') };
  }

  if (bid.status !== 'pending' && bid.status !== 'shortlisted') {
    return { data: null, error: t('cannotRejectBidStatus') };
  }

  const updateData: Record<string, unknown> = { status: 'rejected' };
  if (reasonAr) updateData.rejection_reason_ar = reasonAr;
  if (reasonEn) updateData.rejection_reason_en = reasonEn;

  const { error } = await db(supabase)
    .from('bids')
    .update(updateData)
    .eq('id', bidId);

  if (error) return { data: null, error: t('genericError') };

  // Trigger bid_rejected notification to contractor
  const { data: rejProject } = await db(supabase)
    .from('projects')
    .select('title_ar, title_en')
    .eq('id', bid.project_id)
    .single();

  const { data: rejBid } = await db(supabase)
    .from('bids')
    .select('contractor_id')
    .eq('id', bidId)
    .single();

  if (rejBid) {
    notifyBidRejected({
      contractorId: rejBid.contractor_id,
      projectTitle: { ar: rejProject?.title_ar || '', en: rejProject?.title_en || '' },
      bidId: bidId,
    }).catch(() => {});
  }

  revalidatePath(`/dashboard/projects/${bid.project_id}/bids`);
  return { data: { status: 'rejected' }, error: null };
}
