// =============================================================================
// Muhandes HUB — Review Server Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { ReviewSchema, EditReviewSchema } from '@/schemas/review';
import type { ActionResult } from '@/types';
import { notifyReviewReceived } from '@/actions/notification-triggers';

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
// SUBMIT REVIEW
// ---------------------------------------------------------------------------
export async function submitReview(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.reviews');
  // 1. Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // 2. Parse & validate
  const raw = {
    deal_id: formData.get('deal_id'),
    overall_rating: formData.get('overall_rating'),
    quality_rating: formData.get('quality_rating') || undefined,
    timeliness_rating: formData.get('timeliness_rating') || undefined,
    communication_rating: formData.get('communication_rating') || undefined,
    would_recommend: formData.get('would_recommend'),
    comment_ar: formData.get('comment_ar'),
    comment_en: formData.get('comment_en'),
  };

  const result = ReviewSchema.safeParse(raw);
  if (!result.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(result.error.issues) };
  }

  const data = result.data;

  // 3. Verify deal exists and user is participant
  const { data: deal, error: dealError } = await db(supabase)
    .from('deals')
    .select('id, status, buyer_id, seller_id, completed_at')
    .eq('id', data.deal_id)
    .single();

  if (dealError || !deal) {
    return { data: null, error: t('dealNotFound') };
  }

  if (deal.buyer_id !== user.id && deal.seller_id !== user.id) {
    return { data: null, error: t('noPermission') };
  }

  // 4. Deal must be completed
  if (deal.status !== 'completed') {
    return { data: null, error: t('dealNotCompleted') };
  }

  // 5. Within 30-day window from completion
  if (deal.completed_at) {
    const completedDate = new Date(deal.completed_at);
    const thirtyDaysLater = new Date(completedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (new Date() > thirtyDaysLater) {
      return { data: null, error: t('reviewWindowExpired') };
    }
  }

  // 6. Determine reviewee (the other party)
  const reviewee_id = deal.buyer_id === user.id ? deal.seller_id : deal.buyer_id;

  // 7. Check no existing review (DB UNIQUE enforces too)
  const { data: existing } = await db(supabase)
    .from('reviews')
    .select('id')
    .eq('deal_id', data.deal_id)
    .eq('reviewer_id', user.id)
    .maybeSingle();

  if (existing) {
    return { data: null, error: t('alreadyReviewed') };
  }

  // 8. Insert review
  const { data: review, error: insertError } = await db(supabase)
    .from('reviews')
    .insert({
      deal_id: data.deal_id,
      reviewer_id: user.id,
      reviewee_id,
      overall_rating: data.overall_rating,
      quality_rating: data.quality_rating ?? null,
      timeliness_rating: data.timeliness_rating ?? null,
      communication_rating: data.communication_rating ?? null,
      would_recommend: data.would_recommend,
      comment_ar: data.comment_ar || null,
      comment_en: data.comment_en || null,
    })
    .select('id')
    .single();

  if (insertError || !review) {
    return { data: null, error: t('submitError') };
  }

  // 9. Side effects: notify reviewee
  const { data: reviewerProfile } = await db(supabase)
    .from('profiles')
    .select('company_name_ar, company_name_en')
    .eq('id', user.id)
    .single();

  notifyReviewReceived({
    userId: reviewee_id,
    reviewerName: reviewerProfile?.company_name_ar || t('defaultUser'),
    rating: data.overall_rating,
    dealId: data.deal_id,
    reviewId: review.id,
  }).catch(() => {});

  revalidatePath('/dashboard/reviews');
  revalidatePath('/dashboard/deals');

  return { data: { id: review.id }, error: null };
}

// ---------------------------------------------------------------------------
// EDIT REVIEW — within 48 hours only
// ---------------------------------------------------------------------------
export async function editReview(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.reviews');
  // 1. Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // 2. Parse & validate
  const raw = {
    review_id: formData.get('review_id'),
    overall_rating: formData.get('overall_rating') || undefined,
    quality_rating: formData.get('quality_rating') || undefined,
    timeliness_rating: formData.get('timeliness_rating') || undefined,
    communication_rating: formData.get('communication_rating') || undefined,
    would_recommend: formData.get('would_recommend') || undefined,
    comment_ar: formData.get('comment_ar'),
    comment_en: formData.get('comment_en'),
  };

  const result = EditReviewSchema.safeParse(raw);
  if (!result.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(result.error.issues) };
  }

  const data = result.data;

  // 3. Fetch review & verify ownership
  const { data: review, error: fetchError } = await db(supabase)
    .from('reviews')
    .select('id, reviewer_id, created_at')
    .eq('id', data.review_id)
    .single();

  if (fetchError || !review) {
    return { data: null, error: t('reviewNotFound') };
  }

  if (review.reviewer_id !== user.id) {
    return { data: null, error: t('cannotEditOthersReview') };
  }

  // 4. Verify within 48-hour edit window
  const createdAt = new Date(review.created_at);
  const fortyEightHoursLater = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000);
  if (new Date() > fortyEightHoursLater) {
    return { data: null, error: t('editWindowExpired') };
  }

  // 5. Build update object (only provided fields)
  const updates: Record<string, unknown> = {};
  if (data.overall_rating !== undefined) updates.overall_rating = data.overall_rating;
  if (data.quality_rating !== undefined) updates.quality_rating = data.quality_rating;
  if (data.timeliness_rating !== undefined) updates.timeliness_rating = data.timeliness_rating;
  if (data.communication_rating !== undefined) updates.communication_rating = data.communication_rating;
  if (data.would_recommend !== undefined) updates.would_recommend = data.would_recommend;
  if (data.comment_ar !== undefined) updates.comment_ar = data.comment_ar || null;
  if (data.comment_en !== undefined) updates.comment_en = data.comment_en || null;

  if (Object.keys(updates).length === 0) {
    return { data: null, error: t('noChanges') };
  }

  // 6. Update
  const { error: updateError } = await db(supabase)
    .from('reviews')
    .update(updates)
    .eq('id', data.review_id);

  if (updateError) {
    return { data: null, error: t('editError') };
  }

  revalidatePath('/dashboard/reviews');

  return { data: { id: data.review_id }, error: null };
}
