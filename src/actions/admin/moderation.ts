// =============================================================================
// Muqawil HUB — Admin Moderation Actions
// =============================================================================
// ⚠️ All actions require is_admin = true. Uses Admin client for bypassing RLS.
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import type { ActionResult } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

// ---------------------------------------------------------------------------
// Helper: verify admin
// ---------------------------------------------------------------------------
async function verifyAdmin(): Promise<{ adminId: string } | { error: string }> {
  const t = await getTranslations('actions.adminModeration');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: t('mustLogin') };

  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) return { error: t('adminOnly') };
  return { adminId: user.id };
}

// ---------------------------------------------------------------------------
// Helper: log admin action
// ---------------------------------------------------------------------------
async function logAudit(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> = {},
) {
  const adminClient = createAdminClient();
  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';

  await db(adminClient).from('admin_audit_log').insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
    ip_address: ip,
  });
}

// ---------------------------------------------------------------------------
// APPROVE POST
// ---------------------------------------------------------------------------
export async function approvePost(
  postId: string,
  postType: 'project' | 'product' | 'rfq',
): Promise<ActionResult<{ approved: boolean }>> {
  const t = await getTranslations('actions.adminModeration');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();
  const table = postType === 'project' ? 'projects' : postType === 'product' ? 'products' : 'rfqs';

  // Fetch post
  const { data: post, error: fetchError } = await db(adminClient)
    .from(table)
    .select('id, status, user_id')
    .eq('id', postId)
    .single();

  if (fetchError || !post) return { data: null, error: t('postNotFound') };
  if (post.status !== 'pending') return { data: null, error: t('notPending') };

  // Update status → published
  const { error: updateError } = await db(adminClient)
    .from(table)
    .update({ status: 'published' })
    .eq('id', postId);

  if (updateError) return { data: null, error: t('approveError') };

  // TODO: Index in Typesense
  // TODO: Send post_approved notification to poster

  await logAudit(auth.adminId, 'approve_post', postType, postId, { status: 'published' });
  revalidatePath('/admin/posts');

  return { data: { approved: true }, error: null };
}

// ---------------------------------------------------------------------------
// REJECT POST
// ---------------------------------------------------------------------------
export async function rejectPost(
  postId: string,
  postType: 'project' | 'product' | 'rfq',
  reasonAr: string,
  reasonEn: string,
): Promise<ActionResult<{ rejected: boolean }>> {
  const t = await getTranslations('actions.adminModeration');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();
  const table = postType === 'project' ? 'projects' : postType === 'product' ? 'products' : 'rfqs';

  // Fetch post
  const { data: post, error: fetchError } = await db(adminClient)
    .from(table)
    .select('id, status, user_id')
    .eq('id', postId)
    .single();

  if (fetchError || !post) return { data: null, error: t('postNotFound') };
  if (post.status !== 'pending') return { data: null, error: t('notPending') };

  // Update status → rejected with reason
  const { error: updateError } = await db(adminClient)
    .from(table)
    .update({
      status: 'rejected',
      rejection_reason_ar: reasonAr,
      rejection_reason_en: reasonEn,
    })
    .eq('id', postId);

  if (updateError) return { data: null, error: t('rejectError') };

  // TODO: Remove from Typesense if indexed
  // TODO: Send post_rejected notification to poster

  await logAudit(auth.adminId, 'reject_post', postType, postId, { reason_ar: reasonAr, reason_en: reasonEn });
  revalidatePath('/admin/posts');

  return { data: { rejected: true }, error: null };
}

// ---------------------------------------------------------------------------
// HIDE / UNHIDE REVIEW
// ---------------------------------------------------------------------------
export async function toggleReviewVisibility(
  reviewId: string,
  hide: boolean,
): Promise<ActionResult<{ hidden: boolean }>> {
  const t = await getTranslations('actions.adminModeration');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  const { error } = await db(adminClient)
    .from('reviews')
    .update({ is_hidden: hide })
    .eq('id', reviewId);

  if (error) return { data: null, error: t('toggleReviewError') };

  await logAudit(auth.adminId, hide ? 'hide_review' : 'unhide_review', 'review', reviewId);
  revalidatePath('/admin/reviews');

  return { data: { hidden: hide }, error: null };
}
