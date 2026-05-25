// =============================================================================
// Muhandes HUB â€” Bid Server Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';
import { localizeFieldErrors } from '@/lib/zod-i18n';
import { BidSchema, UpdateBidSchema, InviteToBidSchema } from '@/schemas/bid';
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
    .select('role, classification')
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
    const SAUDI_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3, no DST in Saudi Arabia
    const nowSaudi = new Date(Date.now() + SAUDI_OFFSET_MS);
    const startOfMonthSaudi = new Date(
      Date.UTC(nowSaudi.getUTCFullYear(), nowSaudi.getUTCMonth(), 1) - SAUDI_OFFSET_MS
    );

    const { count } = await db(supabase)
      .from('bids')
      .select('id', { count: 'exact' })
      .eq('contractor_id', user.id)
      .gte('submitted_at', startOfMonthSaudi.toISOString());

    if ((count ?? 0) >= monthlyLimit) {
      return { data: null, error: t('monthlyLimitReached', { limit: monthlyLimit }) };
    }
  }

  // 4. Parse form data
  const raw = {
    project_id: formData.get('project_id'),
    amount: formData.get('amount'),
    timeline_value: formData.get('timeline_value'),
    timeline_unit: formData.get('timeline_unit') || 'days',
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
    .select('id, status, classification, owner_id, title_ar, title_en, slug_ar, slug_en')
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
  if (project.classification) {
    if (!profile.classification) {
      return { data: null, error: t('insufficientClassification') };
    }
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

  // 9. Convert timeline value + unit to days
  const unitMultiplier = { days: 1, months: 30, years: 365 } as const;
  const timelineDays = parsed.data.timeline_value * (unitMultiplier[parsed.data.timeline_unit] ?? 1);

  // 9b. Handle file attachments
  const bidFiles = formData.getAll('bid_attachments') as File[];
  const attachmentsMeta: { url: string; name: string; size: number; type: string }[] = [];
  if (bidFiles.length > 0) {
    const { uploadFile: doUpload } = await import('@/actions/uploads');
    for (const file of bidFiles) {
      if (!file || file.size === 0) continue;
      const uploadResult = await doUpload('bid-attachments', file, `${user.id}/${parsed.data.project_id}/${Date.now()}-${file.name}`);
      if (uploadResult.data) {
        attachmentsMeta.push({
          url: uploadResult.data.url,
          name: file.name,
          size: file.size,
          type: file.type,
        });
      }
    }
  }

  // 9c. Insert bid
  const { data: bid, error } = await db(supabase)
    .from('bids')
    .insert({
      project_id: parsed.data.project_id,
      contractor_id: user.id,
      amount: parsed.data.amount,
      timeline_days: timelineDays,
      methodology_ar: parsed.data.methodology_ar || null,
      methodology_en: parsed.data.methodology_en || null,
      attachments: attachmentsMeta.length > 0 ? attachmentsMeta : null,
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
    projectSlug: project.slug_en || project.slug_ar || undefined,
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
    timeline_value: formData.get('timeline_value'),
    timeline_unit: formData.get('timeline_unit') || 'days',
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

  const unitMultiplier2 = { days: 1, months: 30, years: 365 } as const;
  const updatedTimelineDays = parsed.data.timeline_value * (unitMultiplier2[parsed.data.timeline_unit] ?? 1);

  const { error } = await db(supabase)
    .from('bids')
    .update({
      amount: parsed.data.amount,
      timeline_days: updatedTimelineDays,
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

  // Use admin client — RLS on bids only allows contractor self-updates
  const admin = createAdminClient();
  const { error } = await db(admin)
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
    .select('id, owner_id, title_ar, title_en')
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

  // 1. Award bid (use admin client — RLS on bids only allows contractor updates)
  const { error: awardError } = await db(admin)
    .from('bids')
    .update({ status: 'awarded' })
    .eq('id', bidId);

  if (awardError) return { data: null, error: t('awardError') };

  // 2. Reject all other bids on this project
  await db(admin)
    .from('bids')
    .update({ status: 'rejected' })
    .eq('project_id', bid.project_id)
    .neq('id', bidId)
    .in('status', ['pending', 'shortlisted']);

  // 3. Update project status to awarded
  await db(admin)
    .from('projects')
    .update({ status: 'awarded' })
    .eq('id', bid.project_id);

  // 4. Create DEAL-PROJECT (use admin client — no INSERT RLS policy on deals)
  // Use English title for ASCII-safe slug, fall back to short ID
  const slugBase = project.title_en
    ? slugify(project.title_en).slice(0, 40)
    : bid.project_id.slice(0, 8);
  const { data: deal, error: dealError } = await db(admin)
    .from('deals')
    .insert({
      title_slug: `deal-${slugBase}`,
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
    dealId: deal.id,
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

  // Use admin client — RLS on bids only allows contractor self-updates
  const admin = createAdminClient();
  const { error } = await db(admin)
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

// ---------------------------------------------------------------------------
// SEND BID INVITATION (project owner invites contractor to bid)
// ---------------------------------------------------------------------------
export async function sendBidInvitation(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.bids');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Only project owners can invite contractors to bid
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role, company_name_ar')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'project_owner') {
    return { data: null, error: t('unauthorized') };
  }

  const raw = {
    contractor_id: formData.get('contractor_id'),
    project_id: formData.get('project_id'),
    message_ar: formData.get('message_ar') || undefined,
    message_en: formData.get('message_en') || undefined,
  };

  const parsed = InviteToBidSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: await toFieldErrors(parsed.error.issues) };
  }

  // Verify project is published and owned by current user
  const { data: project } = await db(supabase)
    .from('projects')
    .select('id, owner_id, status, title_ar, title_en')
    .eq('id', parsed.data.project_id)
    .single();

  if (!project || project.status !== 'published') {
    return { data: null, error: t('projectNotAvailable') };
  }
  if (project.owner_id !== user.id) {
    return { data: null, error: t('unauthorized') };
  }

  // Verify target is a contractor
  const { data: contractor } = await db(supabase)
    .from('profiles')
    .select('id, role')
    .eq('id', parsed.data.contractor_id)
    .eq('role', 'contractor')
    .single();

  if (!contractor) {
    return { data: null, error: t('contractorNotFound') };
  }

  // Can't invite yourself
  if (contractor.id === user.id) {
    return { data: null, error: t('cannotBidOwnProject') };
  }

  // Check for duplicate invitation (reuse hire_requests with type discrimination)
  const { data: existing } = await db(supabase)
    .from('hire_requests')
    .select('id')
    .eq('requester_id', user.id)
    .eq('supplier_id', parsed.data.contractor_id)
    .eq('project_id', parsed.data.project_id)
    .eq('status', 'pending')
    .single();

  if (existing) {
    return { data: null, error: t('duplicateBidInvitation') };
  }

  // Insert bid invitation (reuse hire_requests table — supplier_id stores invitee)
  const { data: invitation, error } = await db(supabase)
    .from('hire_requests')
    .insert({
      requester_id: user.id,
      supplier_id: parsed.data.contractor_id,
      description_ar: parsed.data.message_ar || 'دعوة لتقديم عرض',
      description_en: parsed.data.message_en || 'Invitation to bid',
      project_id: parsed.data.project_id,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !invitation) {
    return { data: null, error: t('submitError') };
  }

  // Notify contractor
  notifyBidReceived({
    ownerId: parsed.data.contractor_id,
    projectTitle: { ar: project.title_ar || '', en: project.title_en || '' },
    bidderName: profile.company_name_ar || '',
    projectId: parsed.data.project_id,
    bidId: invitation.id,
  }).catch(() => {});

  revalidatePath('/dashboard/invitations');
  return { data: { id: invitation.id }, error: null };
}
