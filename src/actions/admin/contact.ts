// =============================================================================
// Muqawil HUB — Admin Contact & Email Actions
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

async function verifyAdmin(): Promise<{ adminId: string } | { error: string }> {
  const t = await getTranslations('actions.adminContact');
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
// SEND EMAIL TO USER (via Resend)
// ---------------------------------------------------------------------------
export async function sendEmailToUser(
  toEmail: string,
  subject: string,
  body: string,
  userId: string,
): Promise<ActionResult<{ sent: boolean }>> {
  const t = await getTranslations('actions.adminContact');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  if (!toEmail || !subject || !body) {
    return { data: null, error: t('allFieldsRequired') };
  }

  try {
    const { sendEmail } = await import('@/lib/resend/client');
    const result = await sendEmail({
      to: toEmail,
      subject: { ar: subject, en: subject },
      heading: { ar: 'رسالة من إدارة المنصة', en: 'Message from Platform Admin' },
      body: { ar: body, en: body },
    });
    if (!result.success) return { data: null, error: t('sendError') };
  } catch {
    return { data: null, error: t('sendError') };
  }

  await logAudit(auth.adminId, 'send_email', 'user', userId, {
    to: toEmail,
    subject,
  });

  return { data: { sent: true }, error: null };
}

// ---------------------------------------------------------------------------
// GET CONTACT SUBMISSIONS
// ---------------------------------------------------------------------------
export async function getContactSubmissions(): Promise<ActionResult<Record<string, unknown>[]>> {
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  const { data, error } = await db(adminClient)
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return { data: null, error: 'Failed to fetch submissions' };
  return { data: data ?? [], error: null };
}

// ---------------------------------------------------------------------------
// MARK CONTACT SUBMISSION READ / UNREAD
// ---------------------------------------------------------------------------
export async function toggleContactRead(
  submissionId: string,
  isRead: boolean,
): Promise<ActionResult<{ toggled: boolean }>> {
  const t = await getTranslations('actions.adminContact');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  const { error } = await db(adminClient)
    .from('contact_submissions')
    .update({ is_read: isRead })
    .eq('id', submissionId);

  if (error) return { data: null, error: t('updateError') };

  await logAudit(auth.adminId, isRead ? 'mark_contact_read' : 'mark_contact_unread', 'contact_submission', submissionId);
  revalidatePath('/admin/contacts');

  return { data: { toggled: true }, error: null };
}

// ---------------------------------------------------------------------------
// DELETE CONTACT SUBMISSION
// ---------------------------------------------------------------------------
export async function deleteContactSubmission(
  submissionId: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  const t = await getTranslations('actions.adminContact');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  const { error } = await db(adminClient)
    .from('contact_submissions')
    .delete()
    .eq('id', submissionId);

  if (error) return { data: null, error: t('deleteError') };

  await logAudit(auth.adminId, 'delete_contact', 'contact_submission', submissionId);
  revalidatePath('/admin/contacts');

  return { data: { deleted: true }, error: null };
}
