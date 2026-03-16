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
