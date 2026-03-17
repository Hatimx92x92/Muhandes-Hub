// =============================================================================
// Muqawil HUB — Admin User Management Actions
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

async function verifyAdmin(): Promise<{ adminId: string } | { error: string }> {
  const t = await getTranslations('actions.adminUsers');
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
// APPROVE USER DOCUMENTS
// ---------------------------------------------------------------------------
export async function approveUserDocuments(
  userId: string,
): Promise<ActionResult<{ approved: boolean }>> {
  const t = await getTranslations('actions.adminUsers');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  // Update all pending docs → approved
  const { error: docError } = await db(adminClient)
    .from('verification_documents')
    .update({
      status: 'approved',
      reviewed_by: auth.adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('status', 'pending');

  if (docError) return { data: null, error: t('approveDocsError') };

  // Update user verification status → active
  const { error: profileError } = await db(adminClient)
    .from('profiles')
    .update({ verification_status: 'active' })
    .eq('id', userId);

  if (profileError) return { data: null, error: t('updateUserStatusError') };

  // TODO: Send document_approved notification

  await logAudit(auth.adminId, 'approve_documents', 'user', userId);
  revalidatePath('/admin/users');

  return { data: { approved: true }, error: null };
}

// ---------------------------------------------------------------------------
// REJECT USER DOCUMENTS
// ---------------------------------------------------------------------------
export async function rejectUserDocuments(
  userId: string,
  reasonAr: string,
  reasonEn: string,
): Promise<ActionResult<{ rejected: boolean }>> {
  const t = await getTranslations('actions.adminUsers');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  const { error: docError } = await db(adminClient)
    .from('verification_documents')
    .update({
      status: 'rejected',
      admin_notes_ar: reasonAr,
      admin_notes_en: reasonEn,
      reviewed_by: auth.adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('status', 'pending');

  if (docError) return { data: null, error: t('rejectDocsError') };

  // TODO: Send document_rejected notification

  await logAudit(auth.adminId, 'reject_documents', 'user', userId, { reason_ar: reasonAr });
  revalidatePath('/admin/users');

  return { data: { rejected: true }, error: null };
}

// ---------------------------------------------------------------------------
// BAN USER
// ---------------------------------------------------------------------------
export async function banUser(
  userId: string,
  reason?: string,
): Promise<ActionResult<{ banned: boolean }>> {
  const t = await getTranslations('actions.adminUsers');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  const { error } = await db(adminClient)
    .from('profiles')
    .update({ verification_status: 'banned' })
    .eq('id', userId);

  if (error) return { data: null, error: t('banError') };

  await logAudit(auth.adminId, 'ban_user', 'user', userId, { reason });
  revalidatePath('/admin/users');

  return { data: { banned: true }, error: null };
}

// ---------------------------------------------------------------------------
// UNBAN USER
// ---------------------------------------------------------------------------
export async function unbanUser(
  userId: string,
): Promise<ActionResult<{ unbanned: boolean }>> {
  const t = await getTranslations('actions.adminUsers');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  const { error } = await db(adminClient)
    .from('profiles')
    .update({ verification_status: 'active' })
    .eq('id', userId);

  if (error) return { data: null, error: t('unbanError') };

  await logAudit(auth.adminId, 'unban_user', 'user', userId);
  revalidatePath('/admin/users');

  return { data: { unbanned: true }, error: null };
}

// ---------------------------------------------------------------------------
// RESTRICT USER
// ---------------------------------------------------------------------------
export async function restrictUser(
  userId: string,
  reason?: string,
): Promise<ActionResult<{ restricted: boolean }>> {
  const t = await getTranslations('actions.adminUsers');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  const { error } = await db(adminClient)
    .from('profiles')
    .update({ verification_status: 'restricted' })
    .eq('id', userId);

  if (error) return { data: null, error: t('restrictError') };

  await logAudit(auth.adminId, 'restrict_user', 'user', userId, { reason });
  revalidatePath('/admin/users');

  return { data: { restricted: true }, error: null };
}

// ---------------------------------------------------------------------------
// UNRESTRICT USER
// ---------------------------------------------------------------------------
export async function unrestrictUser(
  userId: string,
): Promise<ActionResult<{ unrestricted: boolean }>> {
  const t = await getTranslations('actions.adminUsers');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  const { error } = await db(adminClient)
    .from('profiles')
    .update({ verification_status: 'active' })
    .eq('id', userId);

  if (error) return { data: null, error: t('unrestrictError') };

  await logAudit(auth.adminId, 'unrestrict_user', 'user', userId);
  revalidatePath('/admin/users');

  return { data: { unrestricted: true }, error: null };
}

// ---------------------------------------------------------------------------
// GET FULL USER DETAILS (for admin user detail page)
// ---------------------------------------------------------------------------
export async function getFullUserDetails(
  userId: string,
): Promise<ActionResult<Record<string, unknown>>> {
  const t = await getTranslations('actions.adminUsers');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  // Fetch auth user data (email, phone, last sign-in, provider, etc.)
  const { data: authData, error: authError } = await adminClient.auth.admin.getUserById(userId);
  if (authError || !authData?.user) return { data: null, error: t('userNotFound') };

  const authUser = authData.user;

  // Fetch profile
  const { data: profile } = await db(adminClient)
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // Fetch subscription
  const { data: subscription } = await db(adminClient)
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch verification documents
  const { data: documents } = await db(adminClient)
    .from('verification_documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Fetch activity counts in parallel
  const [
    { count: totalDeals },
    { count: totalProjects },
    { count: totalProducts },
    { count: totalBids },
    { count: totalReviews },
    { data: reviewsReceived },
  ] = await Promise.all([
    db(adminClient).from('deals').select('*', { count: 'exact', head: true }).or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
    db(adminClient).from('projects').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    db(adminClient).from('products').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    db(adminClient).from('bids').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    db(adminClient).from('reviews').select('*', { count: 'exact', head: true }).eq('reviewed_id', userId),
    db(adminClient).from('reviews').select('rating').eq('reviewed_id', userId),
  ]);

  const avgRating = reviewsReceived && reviewsReceived.length > 0
    ? reviewsReceived.reduce((sum: number, r: Record<string, number>) => sum + (r.rating ?? 0), 0) / reviewsReceived.length
    : 0;

  return {
    data: {
      auth: {
        email: authUser.email,
        phone: authUser.phone,
        lastSignIn: authUser.last_sign_in_at,
        createdAt: authUser.created_at,
        emailConfirmed: authUser.email_confirmed_at,
        provider: authUser.app_metadata?.provider ?? 'email',
        userMetadata: authUser.user_metadata,
      },
      profile,
      subscription,
      documents: documents ?? [],
      activity: {
        totalDeals: totalDeals ?? 0,
        totalProjects: totalProjects ?? 0,
        totalProducts: totalProducts ?? 0,
        totalBids: totalBids ?? 0,
        totalReviews: totalReviews ?? 0,
        avgRating: Math.round(avgRating * 10) / 10,
      },
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// BULK ACTION: Approve / Ban / Restrict multiple users
// ---------------------------------------------------------------------------
export async function bulkUserAction(
  userIds: string[],
  action: 'approve' | 'ban' | 'unban' | 'restrict' | 'unrestrict',
): Promise<ActionResult<{ processed: number }>> {
  const t = await getTranslations('actions.adminUsers');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  if (!userIds.length || userIds.length > 50) {
    return { data: null, error: 'Invalid selection' };
  }

  const adminClient = createAdminClient();
  const statusMap: Record<string, string> = {
    approve: 'active',
    ban: 'banned',
    unban: 'active',
    restrict: 'restricted',
    unrestrict: 'active',
  };

  const newStatus = statusMap[action];
  const { error } = await db(adminClient)
    .from('profiles')
    .update({ verification_status: newStatus })
    .in('id', userIds)
    .neq('is_admin', true);

  if (error) return { data: null, error: t('updateUserStatusError') };

  await logAudit(auth.adminId, `bulk_${action}`, 'users', 'bulk', {
    user_ids: userIds,
    new_status: newStatus,
  });

  revalidatePath('/admin/users');
  return { data: { processed: userIds.length }, error: null };
}
