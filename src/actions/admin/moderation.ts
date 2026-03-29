// =============================================================================
// Muhandes HUB — Admin Moderation Actions
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
    .select('id, status')
    .eq('id', postId)
    .single();

  if (fetchError || !post) return { data: null, error: t('postNotFound') };
  if (post.status !== 'pending') return { data: null, error: t('notPending') };

  // Update status → published
  const { error: updateError } = await db(adminClient)
    .from(table)
    .update({ status: 'published', approved_by: auth.adminId, approved_at: new Date().toISOString() })
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
    .select('id, status')
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

// ---------------------------------------------------------------------------
// EDIT POST (admin can edit any post)
// ---------------------------------------------------------------------------
export async function adminEditPost(
  postId: string,
  postType: 'project' | 'product' | 'rfq',
  updates: {
    title_ar?: string;
    title_en?: string;
    description_ar?: string;
    description_en?: string;
  },
): Promise<ActionResult<{ updated: boolean }>> {
  const t = await getTranslations('actions.adminModeration');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();
  const table = postType === 'project' ? 'projects' : postType === 'product' ? 'products' : 'rfqs';

  // Build update object only with provided fields
  const updateData: Record<string, string> = {};
  if (updates.title_ar !== undefined) updateData.title_ar = updates.title_ar;
  if (updates.title_en !== undefined) updateData.title_en = updates.title_en;
  if (updates.description_ar !== undefined) updateData.description_ar = updates.description_ar;
  if (updates.description_en !== undefined) updateData.description_en = updates.description_en;

  if (Object.keys(updateData).length === 0) {
    return { data: null, error: t('noChanges') };
  }

  const { error: updateError } = await db(adminClient)
    .from(table)
    .update(updateData)
    .eq('id', postId);

  if (updateError) return { data: null, error: t('editError') };

  await logAudit(auth.adminId, 'edit_post', postType, postId, updateData);
  revalidatePath('/admin/posts');

  return { data: { updated: true }, error: null };
}

// ---------------------------------------------------------------------------
// GET POST DETAILS (for edit page)
// ---------------------------------------------------------------------------
export async function getPostDetails(
  postId: string,
  postType: 'project' | 'product' | 'rfq',
): Promise<ActionResult<Record<string, unknown>>> {
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();
  const table = postType === 'project' ? 'projects' : postType === 'product' ? 'products' : 'rfqs';

  const { data, error } = await db(adminClient)
    .from(table)
    .select('*')
    .eq('id', postId)
    .single();

  if (error || !data) return { data: null, error: 'Post not found' };
  return { data, error: null };
}
