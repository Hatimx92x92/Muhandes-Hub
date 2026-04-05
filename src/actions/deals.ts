// =============================================================================
// Muhandes HUB — Deal Server Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import {
  MilestoneSchema,
  ProofSchema,
  ProofRejectionSchema,
  CancelRequestSchema,
  SkipToFinishSchema,
} from '@/schemas/deal';
import type { ActionResult } from '@/types';
import { VAT_RATE } from '@/types';
import {
  notifyDealCompleted,
  notifyDealStatusChanged,
  notifyDealFlaggedForReview,
  notifyCancellationRequested,
  notifyCancellationResolved,
  notifySkipMilestoneRequested,
  notifySkipMilestoneResolved,
} from '@/actions/notification-triggers';
import { createCommissionForDeal } from '@/actions/commissions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: Awaited<ReturnType<typeof createClient>>): any {
  return supabase;
}

function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? 'form');
    fieldErrors[key] = fieldErrors[key] ?? [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

// ---------------------------------------------------------------------------
// Helper: verify deal participant
// ---------------------------------------------------------------------------
async function verifyDealParticipant(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  dealId: string,
  userId: string,
): Promise<{ deal: Record<string, unknown>; role: 'buyer' | 'seller' } | { error: string }> {
  const { data: deal, error } = await db(supabase)
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .single();

  if (error || !deal) return { error: 'dealNotFound' };
  if (deal.buyer_id !== userId && deal.seller_id !== userId) {
    return { error: 'noAccessToDeal' };
  }

  const role = deal.buyer_id === userId ? 'buyer' : 'seller';
  return { deal, role };
}

// ---------------------------------------------------------------------------
// Helper: log deal activity
// ---------------------------------------------------------------------------
async function logActivity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  dealId: string,
  actorId: string,
  action: string,
  details: Record<string, unknown> = {},
) {
  await db(supabase).from('deal_activity_log').insert({
    deal_id: dealId,
    actor_id: actorId,
    action,
    details,
  });
}

// ---------------------------------------------------------------------------
// CREATE MILESTONE
// ---------------------------------------------------------------------------
export async function createMilestone(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.deals');

  // 1. Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // 2. Parse
  const raw = {
    deal_id: formData.get('deal_id'),
    title_ar: formData.get('title_ar'),
    title_en: formData.get('title_en'),
    description_ar: formData.get('description_ar'),
    description_en: formData.get('description_en'),
    due_date: formData.get('due_date'),
    payment_amount: formData.get('payment_amount'),
    sort_order: formData.get('sort_order'),
  };

  const result = MilestoneSchema.safeParse(raw);
  if (!result.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(result.error.issues) };
  }

  const data = result.data;

  // 3. Verify deal participant (buyer creates milestones)
  const check = await verifyDealParticipant(supabase, data.deal_id, user.id);
  if ('error' in check) return { data: null, error: t(check.error as 'dealNotFound' | 'noAccessToDeal') };

  if (check.role !== 'buyer') {
    return { data: null, error: t('buyerOnlyMilestones') };
  }

  // 4. Validate deal is active/in_progress
  if (!['active', 'in_progress'].includes(check.deal.status as string)) {
    return { data: null, error: t('cannotAddToCompletedDeal') };
  }

  // 5. Check total milestone payments ≤ deal value
  const { data: existingMilestones } = await db(supabase)
    .from('deal_milestones')
    .select('payment_amount')
    .eq('deal_id', data.deal_id)
    .eq('is_suggestion', false);

  const currentTotal = (existingMilestones || []).reduce(
    (sum: number, m: Record<string, unknown>) => sum + (Number(m.payment_amount) || 0),
    0,
  );
  const newPayment = data.payment_amount || 0;
  const dealValue = Number(check.deal.value) || 0;

  if (currentTotal + newPayment > dealValue) {
    return { data: null, error: t('milestoneTotalExceeds', { total: currentTotal + newPayment, dealValue }) };
  }

  // 6. Insert milestone
  const { data: milestone, error: insertError } = await db(supabase)
    .from('deal_milestones')
    .insert({
      deal_id: data.deal_id,
      title_ar: data.title_ar,
      title_en: data.title_en || '',
      description_ar: data.description_ar || '',
      description_en: data.description_en || '',
      due_date: data.due_date || null,
      payment_amount: newPayment,
      sort_order: data.sort_order || 0,
      is_suggestion: false,
    })
    .select('id')
    .single();

  if (insertError || !milestone) {
    return { data: null, error: t('milestoneCreateError') };
  }

  // 7. Log activity
  await logActivity(supabase, data.deal_id, user.id, 'milestone_created', {
    milestone_id: milestone.id,
    title: data.title_ar,
  });

  // 8. Update deal to in_progress if still active
  if (check.deal.status === 'active') {
    await db(supabase)
      .from('deals')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('id', data.deal_id);
  }

  revalidatePath(`/dashboard/deals/${data.deal_id}`);
  return { data: { id: milestone.id }, error: null };
}

// ---------------------------------------------------------------------------
// SUGGEST MILESTONE CHANGE (seller)
// ---------------------------------------------------------------------------
export async function suggestMilestoneChange(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.deals');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const milestoneId = formData.get('milestone_id') as string;
  if (!milestoneId) return { data: null, error: t('milestoneIdRequired') };

  // Fetch milestone
  const { data: milestone } = await db(supabase)
    .from('deal_milestones')
    .select('*, deal:deals(*)')
    .eq('id', milestoneId)
    .single();

  if (!milestone) return { data: null, error: t('milestoneNotFound') };

  // Verify seller
  if (milestone.deal?.seller_id !== user.id) {
    return { data: null, error: t('sellerOnlySuggestions') };
  }

  // Create suggestion as a new milestone row with is_suggestion=true
  const { data: suggestion, error } = await db(supabase)
    .from('deal_milestones')
    .insert({
      deal_id: milestone.deal_id,
      title_ar: (formData.get('title_ar') as string) || milestone.title_ar,
      title_en: (formData.get('title_en') as string) || milestone.title_en,
      description_ar: (formData.get('description_ar') as string) || milestone.description_ar,
      description_en: (formData.get('description_en') as string) || milestone.description_en,
      due_date: (formData.get('due_date') as string) || milestone.due_date,
      payment_amount: formData.get('payment_amount') ? Number(formData.get('payment_amount')) : milestone.payment_amount,
      sort_order: milestone.sort_order,
      is_suggestion: true,
      suggested_by: user.id,
    })
    .select('id')
    .single();

  if (error || !suggestion) return { data: null, error: t('suggestionCreateError') };

  await logActivity(supabase, milestone.deal_id, user.id, 'milestone_suggestion', {
    milestone_id: milestoneId,
    suggestion_id: suggestion.id,
  });

  revalidatePath(`/dashboard/deals/${milestone.deal_id}`);
  return { data: { id: suggestion.id }, error: null };
}

// ---------------------------------------------------------------------------
// APPROVE MILESTONE SUGGESTION (buyer)
// ---------------------------------------------------------------------------
export async function approveMilestoneSuggestion(
  suggestionId: string,
): Promise<ActionResult> {
  const t = await getTranslations('actions.deals');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { data: suggestion } = await db(supabase)
    .from('deal_milestones')
    .select('*, deal:deals(*)')
    .eq('id', suggestionId)
    .eq('is_suggestion', true)
    .single();

  if (!suggestion) return { data: null, error: t('suggestionNotFound') };
  if (suggestion.deal?.buyer_id !== user.id) {
    return { data: null, error: t('buyerOnlyApprove') };
  }

  // Apply suggestion: update the original milestone or convert suggestion to real milestone
  await db(supabase)
    .from('deal_milestones')
    .update({
      is_suggestion: false,
      suggestion_approved: true,
    })
    .eq('id', suggestionId);

  await logActivity(supabase, suggestion.deal_id, user.id, 'milestone_suggestion_approved', {
    suggestion_id: suggestionId,
  });

  revalidatePath(`/dashboard/deals/${suggestion.deal_id}`);
  return { data: undefined, error: null };
}

// ---------------------------------------------------------------------------
// REJECT MILESTONE SUGGESTION (buyer)
// ---------------------------------------------------------------------------
export async function rejectMilestoneSuggestion(
  suggestionId: string,
): Promise<ActionResult> {
  const t = await getTranslations('actions.deals');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { data: suggestion } = await db(supabase)
    .from('deal_milestones')
    .select('*, deal:deals(*)')
    .eq('id', suggestionId)
    .eq('is_suggestion', true)
    .single();

  if (!suggestion) return { data: null, error: t('suggestionNotFound') };
  if (suggestion.deal?.buyer_id !== user.id) {
    return { data: null, error: t('buyerOnlyReject') };
  }

  // Delete the suggestion row
  await db(supabase)
    .from('deal_milestones')
    .delete()
    .eq('id', suggestionId);

  await logActivity(supabase, suggestion.deal_id, user.id, 'milestone_suggestion_rejected', {
    suggestion_id: suggestionId,
  });

  revalidatePath(`/dashboard/deals/${suggestion.deal_id}`);
  return { data: undefined, error: null };
}

// ---------------------------------------------------------------------------
// SUBMIT PROOF
// ---------------------------------------------------------------------------
export async function submitProof(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.deals');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const raw = {
    deal_id: formData.get('deal_id'),
    milestone_id: formData.get('milestone_id') || undefined,
    proof_type: formData.get('proof_type'),
    description: formData.get('description'),
    percentage_claim: formData.get('percentage_claim'),
  };

  const result = ProofSchema.safeParse(raw);
  if (!result.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(result.error.issues) };
  }

  const data = result.data;

  // Verify participant
  const check = await verifyDealParticipant(supabase, data.deal_id, user.id);
  if ('error' in check) return { data: null, error: t(check.error as 'dealNotFound' | 'noAccessToDeal') };

  // Validate deal is active/in_progress
  if (!['active', 'in_progress'].includes(check.deal.status as string)) {
    return { data: null, error: t('cannotSubmitProofCompleted') };
  }

  // Validate percentage: current progress + claim ≤ 100
  const progressField = check.role === 'seller' ? 'seller_progress' : 'buyer_progress';
  const currentProgress = Number(check.deal[progressField]) || 0;
  if (currentProgress + data.percentage_claim > 100) {
    return { data: null, error: t('proofPercentageExceeds', { claim: data.percentage_claim, remaining: 100 - currentProgress }) };
  }

  // File URLs would be handled by upload — store empty array for now
  const fileUrls: string[] = [];

  // Insert proof
  const { data: proof, error: insertError } = await db(supabase)
    .from('deal_proofs')
    .insert({
      deal_id: data.deal_id,
      milestone_id: data.milestone_id || null,
      submitter_id: user.id,
      proof_type: data.proof_type,
      description: data.description,
      percentage_claim: data.percentage_claim,
      file_urls: fileUrls,
      status: 'pending',
    })
    .select('id')
    .single();

  if (insertError || !proof) {
    return { data: null, error: t('proofSubmitError') };
  }

  // Update deal to in_progress if still active
  if (check.deal.status === 'active') {
    await db(supabase)
      .from('deals')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('id', data.deal_id);
  }

  await logActivity(supabase, data.deal_id, user.id, 'proof_submitted', {
    proof_id: proof.id,
    proof_type: data.proof_type,
    percentage_claim: data.percentage_claim,
  });

  revalidatePath(`/dashboard/deals/${data.deal_id}`);
  return { data: { id: proof.id }, error: null };
}

// ---------------------------------------------------------------------------
// CONFIRM PROOF (counterparty)
// ---------------------------------------------------------------------------
export async function confirmProof(
  proofId: string,
): Promise<ActionResult<{ confirmed: true; dealCompleted: boolean }>> {
  const t = await getTranslations('actions.deals');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Fetch proof with deal
  const { data: proof } = await db(supabase)
    .from('deal_proofs')
    .select('*, deal:deals(*)')
    .eq('id', proofId)
    .single();

  if (!proof) return { data: null, error: t('proofNotFound') };
  if (proof.status !== 'pending') return { data: null, error: t('proofAlreadyProcessed') };

  // Verify counterparty (not the submitter)
  if (proof.submitter_id === user.id) {
    return { data: null, error: t('cannotConfirmOwnProof') };
  }

  const deal = proof.deal;
  if (!deal || (deal.buyer_id !== user.id && deal.seller_id !== user.id)) {
    return { data: null, error: t('noPermissionConfirm') };
  }

  // Confirm proof
  await db(supabase)
    .from('deal_proofs')
    .update({
      status: 'confirmed',
      confirmed_by: user.id,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', proofId);

  // Update progress bar
  const isSellerProof = proof.submitter_id === deal.seller_id;
  const progressField = isSellerProof ? 'seller_progress' : 'buyer_progress';
  const currentProgress = Number(deal[progressField]) || 0;
  const newProgress = Math.min(100, currentProgress + (proof.percentage_claim || 0));

  await db(supabase)
    .from('deals')
    .update({ [progressField]: newProgress })
    .eq('id', deal.id);

  // Check if both bars at 100% → complete deal
  const otherProgressField = isSellerProof ? 'buyer_progress' : 'seller_progress';
  const otherProgress = Number(deal[otherProgressField]) || 0;
  let dealCompleted = false;

  if (newProgress >= 100 && otherProgress >= 100) {
    await db(supabase)
      .from('deals')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', deal.id);
    dealCompleted = true;

    // Notify both parties of deal completion
    notifyDealCompleted({
      userIds: [deal.buyer_id, deal.seller_id],
      dealNumber: deal.title_slug || deal.id.slice(0, 8),
      dealId: deal.id,
    }).catch(() => {});

    // Create commission record for the seller
    const dealValue = Number(deal.total_value) || 0;
    if (dealValue > 0) {
      createCommissionForDeal({
        dealId: deal.id,
        sellerId: deal.seller_id,
        dealValue,
      }).catch(() => {});
    }

    await logActivity(supabase, deal.id, user.id, 'deal_completed', {});
  }

  await logActivity(supabase, deal.id, user.id, 'proof_confirmed', {
    proof_id: proofId,
    new_progress: newProgress,
    deal_completed: dealCompleted,
  });

  revalidatePath(`/dashboard/deals/${deal.id}`);
  return { data: { confirmed: true, dealCompleted }, error: null };
}

// ---------------------------------------------------------------------------
// REJECT PROOF (counterparty)
// ---------------------------------------------------------------------------
export async function rejectProof(
  _prevState: ActionResult<{ flaggedForAdmin: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ flaggedForAdmin: boolean }>> {
  const t = await getTranslations('actions.deals');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const raw = {
    proof_id: formData.get('proof_id'),
    rejection_reason: formData.get('rejection_reason'),
    rejection_text: formData.get('rejection_text'),
  };

  const result = ProofRejectionSchema.safeParse(raw);
  if (!result.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(result.error.issues) };
  }

  const data = result.data;

  // Fetch proof with deal
  const { data: proof } = await db(supabase)
    .from('deal_proofs')
    .select('*, deal:deals(*)')
    .eq('id', data.proof_id)
    .single();

  if (!proof) return { data: null, error: t('proofNotFound') };
  if (proof.status !== 'pending') return { data: null, error: t('proofAlreadyProcessed') };

  // Verify counterparty
  if (proof.submitter_id === user.id) {
    return { data: null, error: t('cannotRejectOwnProof') };
  }

  const deal = proof.deal;
  if (!deal || (deal.buyer_id !== user.id && deal.seller_id !== user.id)) {
    return { data: null, error: t('noPermissionReject') };
  }

  // Increment rejection count
  const newRejectionCount = (proof.rejection_count || 0) + 1;
  const flaggedForAdmin = newRejectionCount >= 3;

  await db(supabase)
    .from('deal_proofs')
    .update({
      status: 'rejected',
      rejection_reason: data.rejection_reason,
      rejection_text: data.rejection_text || null,
      rejection_count: newRejectionCount,
    })
    .eq('id', data.proof_id);

  // If 3+ rejections on same milestone → flag deal for admin review
  if (flaggedForAdmin) {
    // Fetch admin user IDs to notify
    const { data: admins } = await db(supabase)
      .from('profiles')
      .select('id')
      .eq('is_admin', true);

    const adminIds = (admins || []).map((a: { id: string }) => a.id);
    if (adminIds.length > 0) {
      notifyDealFlaggedForReview({
        adminIds,
        dealId: deal.id,
        dealNumber: deal.title_slug || deal.id.slice(0, 8),
        reason: `${newRejectionCount} proof rejections on proof ${data.proof_id}`,
      }).catch(() => {});
    }

    await logActivity(supabase, deal.id, user.id, 'deal_flagged_admin', {
      reason: `${newRejectionCount} proof rejections on proof ${data.proof_id}`,
    });
  }

  await logActivity(supabase, deal.id, user.id, 'proof_rejected', {
    proof_id: data.proof_id,
    rejection_reason: data.rejection_reason,
    rejection_count: newRejectionCount,
    flagged: flaggedForAdmin,
  });

  revalidatePath(`/dashboard/deals/${deal.id}`);
  return { data: { flaggedForAdmin }, error: null };
}

// ---------------------------------------------------------------------------
// REQUEST CANCELLATION
// ---------------------------------------------------------------------------
export async function requestCancellation(
  _prevState: ActionResult<{ requestId: string; autoApproved: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ requestId: string; autoApproved: boolean }>> {
  const t = await getTranslations('actions.deals');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const raw = {
    deal_id: formData.get('deal_id'),
    reason: formData.get('reason'),
  };

  const result = CancelRequestSchema.safeParse(raw);
  if (!result.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(result.error.issues) };
  }

  const data = result.data;

  // Verify participant
  const check = await verifyDealParticipant(supabase, data.deal_id, user.id);
  if ('error' in check) return { data: null, error: t(check.error as 'dealNotFound' | 'noAccessToDeal') };

  // Deal must not be completed/cancelled
  if (['completed', 'cancelled'].includes(check.deal.status as string)) {
    return { data: null, error: t('cannotCancelCompletedDeal') };
  }

  // Check if counterparty already requested cancellation → auto-approve
  const { data: existingRequest } = await db(supabase)
    .from('deal_cancel_requests')
    .select('id')
    .eq('deal_id', data.deal_id)
    .eq('status', 'pending')
    .neq('requester_id', user.id)
    .single();

  if (existingRequest) {
    // Both parties want cancellation → auto-approve
    await db(supabase)
      .from('deal_cancel_requests')
      .update({ status: 'approved', responded_by: user.id, responded_at: new Date().toISOString() })
      .eq('id', existingRequest.id);

    await db(supabase)
      .from('deals')
      .update({ status: 'cancelled' })
      .eq('id', data.deal_id);

    await logActivity(supabase, data.deal_id, user.id, 'deal_cancelled', {
      auto_approved: true,
    });

    const counterpartyId = check.deal.buyer_id === user.id ? check.deal.seller_id as string : check.deal.buyer_id as string;
    await notifyCancellationResolved({
      userIds: [user.id, counterpartyId],
      dealNumber: data.deal_id.slice(0, 8),
      dealId: data.deal_id,
      outcome: 'approved',
    });

    revalidatePath(`/dashboard/deals/${data.deal_id}`);
    return { data: { requestId: existingRequest.id, autoApproved: true }, error: null };
  }

  // Insert cancel request
  const { data: request, error: insertError } = await db(supabase)
    .from('deal_cancel_requests')
    .insert({
      deal_id: data.deal_id,
      requester_id: user.id,
      reason: data.reason,
      status: 'pending',
    })
    .select('id')
    .single();

  if (insertError || !request) {
    return { data: null, error: t('cancelRequestError') };
  }

  await logActivity(supabase, data.deal_id, user.id, 'cancellation_requested', {
    request_id: request.id,
    reason: data.reason,
  });

  const counterpartyId = check.deal.buyer_id === user.id ? check.deal.seller_id as string : check.deal.buyer_id as string;
  await notifyCancellationRequested({
    counterpartyId,
    dealNumber: data.deal_id.slice(0, 8),
    dealId: data.deal_id,
    reason: data.reason,
  });

  revalidatePath(`/dashboard/deals/${data.deal_id}`);
  return { data: { requestId: request.id, autoApproved: false }, error: null };
}

// ---------------------------------------------------------------------------
// APPROVE CANCELLATION (counterparty)
// ---------------------------------------------------------------------------
export async function approveCancellation(
  requestId: string,
): Promise<ActionResult> {
  const t = await getTranslations('actions.deals');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { data: request } = await db(supabase)
    .from('deal_cancel_requests')
    .select('*, deal:deals(*)')
    .eq('id', requestId)
    .eq('status', 'pending')
    .single();

  if (!request) return { data: null, error: t('cancelRequestNotFound') };

  // Must be the counterparty (not the requester)
  if (request.requester_id === user.id) {
    return { data: null, error: t('cannotApproveOwnRequest') };
  }

  const deal = request.deal;
  if (!deal || (deal.buyer_id !== user.id && deal.seller_id !== user.id)) {
    return { data: null, error: t('noPermissionApprove') };
  }

  // Approve
  await db(supabase)
    .from('deal_cancel_requests')
    .update({ status: 'approved', responded_by: user.id, responded_at: new Date().toISOString() })
    .eq('id', requestId);

  await db(supabase)
    .from('deals')
    .update({ status: 'cancelled' })
    .eq('id', deal.id);

  await logActivity(supabase, deal.id, user.id, 'deal_cancelled', {
    request_id: requestId,
  });

  await notifyCancellationResolved({
    userIds: [deal.buyer_id, deal.seller_id],
    dealNumber: deal.id.slice(0, 8),
    dealId: deal.id,
    outcome: 'approved',
  });

  revalidatePath(`/dashboard/deals/${deal.id}`);
  return { data: undefined, error: null };
}

// ---------------------------------------------------------------------------
// REJECT CANCELLATION (counterparty)
// ---------------------------------------------------------------------------
export async function rejectCancellation(
  requestId: string,
): Promise<ActionResult> {
  const t2 = await getTranslations('actions.deals');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t2('mustLogin') };

  const { data: request } = await db(supabase)
    .from('deal_cancel_requests')
    .select('*, deal:deals(*)')
    .eq('id', requestId)
    .eq('status', 'pending')
    .single();

  if (!request) return { data: null, error: t2('cancelRequestNotFound') };
  if (request.requester_id === user.id) {
    return { data: null, error: t2('cannotRejectOwnRequest') };
  }

  const deal = request.deal;
  if (!deal || (deal.buyer_id !== user.id && deal.seller_id !== user.id)) {
    return { data: null, error: t2('noPermissionReject') };
  }

  await db(supabase)
    .from('deal_cancel_requests')
    .update({ status: 'rejected', responded_by: user.id, responded_at: new Date().toISOString() })
    .eq('id', requestId);

  await logActivity(supabase, deal.id, user.id, 'cancellation_rejected', {
    request_id: requestId,
  });

  await notifyCancellationResolved({
    userIds: [request.requester_id],
    dealNumber: deal.id.slice(0, 8),
    dealId: deal.id,
    outcome: 'rejected',
  });

  revalidatePath(`/dashboard/deals/${deal.id}`);
  return { data: undefined, error: null };
}

// ---------------------------------------------------------------------------
// REQUEST SKIP MILESTONE
// ---------------------------------------------------------------------------
export async function requestSkipToFinish(
  _prevState: ActionResult<{ requestId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ requestId: string }>> {
  const t = await getTranslations('actions.deals');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const raw = {
    deal_id: formData.get('deal_id'),
    reason: formData.get('reason'),
  };

  const result = SkipToFinishSchema.safeParse(raw);
  if (!result.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(result.error.issues) };
  }

  const data = result.data;

  // Fetch deal
  const { data: deal } = await db(supabase)
    .from('deals')
    .select('*')
    .eq('id', data.deal_id)
    .single();

  if (!deal) return { data: null, error: t('dealNotFound') };
  if (deal.buyer_id !== user.id && deal.seller_id !== user.id) {
    return { data: null, error: t('noPermission') };
  }

  const { data: request, error } = await db(supabase)
    .from('deal_skip_requests')
    .insert({
      deal_id: deal.id,
      requester_id: user.id,
      reason: data.reason,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !request) return { data: null, error: t('skipRequestError') };

  await logActivity(supabase, deal.id, user.id, 'skip_to_finish_requested', {
    request_id: request.id,
  });

  const counterpartyId = deal.buyer_id === user.id ? deal.seller_id : deal.buyer_id;
  await notifySkipMilestoneRequested({
    counterpartyId,
    dealNumber: deal.id.slice(0, 8),
    dealId: deal.id,
    milestoneTitle: { ar: 'تخطي إلى الإنهاء', en: 'Skip to Finish' },
  });

  revalidatePath(`/dashboard/deals/${deal.id}`);
  return { data: { requestId: request.id }, error: null };
}

// ---------------------------------------------------------------------------
// APPROVE SKIP MILESTONE (counterparty)
// ---------------------------------------------------------------------------
export async function approveSkipMilestone(
  requestId: string,
): Promise<ActionResult> {
  const t = await getTranslations('actions.deals');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { data: request } = await db(supabase)
    .from('deal_skip_requests')
    .select('*, deal:deals(*)')
    .eq('id', requestId)
    .eq('status', 'pending')
    .single();

  if (!request) return { data: null, error: t('skipRequestNotFound') };
  if (request.requester_id === user.id) {
    return { data: null, error: t('cannotApproveOwnSkip') };
  }

  const deal = request.deal;
  if (!deal || (deal.buyer_id !== user.id && deal.seller_id !== user.id)) {
    return { data: null, error: t('noPermission') };
  }

  const now = new Date().toISOString();

  await db(supabase)
    .from('deal_skip_requests')
    .update({ status: 'approved', responded_by: user.id, responded_at: now })
    .eq('id', requestId);

  // Auto-complete the deal when skip-to-finish is approved
  await db(supabase)
    .from('deals')
    .update({
      status: 'completed',
      completed_at: now,
      seller_progress: 100,
      buyer_progress: 100,
    })
    .eq('id', deal.id);

  await logActivity(supabase, deal.id, user.id, 'skip_milestone_approved', {
    request_id: requestId,
  });

  await logActivity(supabase, deal.id, user.id, 'deal_completed', {
    method: 'skip_to_finish',
  });

  await notifySkipMilestoneResolved({
    requesterId: request.requester_id,
    dealNumber: deal.id.slice(0, 8),
    dealId: deal.id,
    outcome: 'approved',
  });

  revalidatePath(`/dashboard/deals/${deal.id}`);
  return { data: undefined, error: null };
}

// ---------------------------------------------------------------------------
// REJECT SKIP MILESTONE (counterparty)
// ---------------------------------------------------------------------------
export async function rejectSkipMilestone(
  requestId: string,
): Promise<ActionResult> {
  const t = await getTranslations('actions.deals');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { data: request } = await db(supabase)
    .from('deal_skip_requests')
    .select('*, deal:deals(*)')
    .eq('id', requestId)
    .eq('status', 'pending')
    .single();

  if (!request) return { data: null, error: t('skipRequestNotFound') };
  if (request.requester_id === user.id) {
    return { data: null, error: t('cannotRejectOwnSkip') };
  }

  const deal = request.deal;
  if (!deal || (deal.buyer_id !== user.id && deal.seller_id !== user.id)) {
    return { data: null, error: t('noPermission') };
  }

  await db(supabase)
    .from('deal_skip_requests')
    .update({ status: 'rejected', responded_by: user.id, responded_at: new Date().toISOString() })
    .eq('id', requestId);

  await logActivity(supabase, deal.id, user.id, 'skip_milestone_rejected', {
    request_id: requestId,
  });

  await notifySkipMilestoneResolved({
    requesterId: request.requester_id,
    dealNumber: deal.id.slice(0, 8),
    dealId: deal.id,
    outcome: 'rejected',
  });

  revalidatePath(`/dashboard/deals/${deal.id}`);
  return { data: undefined, error: null };
}
