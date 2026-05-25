// =============================================================================
// Muhandes HUB — Notification Server Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTranslations } from 'next-intl/server';
import { NotificationPreferenceSchema } from '@/schemas/message';
import { sendNotificationEmail } from '@/lib/resend/templates';
import type { ActionResult, NotificationType } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: Awaited<ReturnType<typeof createClient>>): any {
  return supabase;
}

// ---------------------------------------------------------------------------
// Helper: convert Zod errors to field errors
// ---------------------------------------------------------------------------
function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? 'form');
    fieldErrors[key] = fieldErrors[key] ?? [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

// ---------------------------------------------------------------------------
// Critical notification types that cannot be muted
// ---------------------------------------------------------------------------
const CRITICAL_TYPES: NotificationType[] = [
  'bid_awarded',
  'deal_created',
  'deal_completed',
  'payment_confirmed',
  'commission_due',
  'commission_overdue',
];

// ---------------------------------------------------------------------------
// CREATE NOTIFICATION (internal — called by other server actions)
// ---------------------------------------------------------------------------
export async function createNotification(params: {
  user_id: string;
  type: NotificationType;
  title_ar: string;
  title_en: string;
  body_ar?: string;
  body_en?: string;
  link?: string;
  entity_type?: string;
  entity_id?: string;
}): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.notifications');
  const admin = createAdminClient();

  const { data: notification, error } = await admin
    .from('notifications')
    .insert({
      user_id: params.user_id,
      type: params.type,
      title_ar: params.title_ar,
      title_en: params.title_en,
      body_ar: params.body_ar ?? null,
      body_en: params.body_en ?? null,
      link: params.link ?? null,
      entity_type: params.entity_type ?? null,
      entity_id: params.entity_id ?? null,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: t('createError') };

  // Email dispatch — fire-and-forget, never blocks notification creation
  const { data: pref } = await admin
    .from('notification_preferences')
    .select('email_enabled')
    .eq('user_id', params.user_id)
    .eq('notification_type', params.type)
    .maybeSingle();

  // No preference row = opt-out model default (enabled)
  const emailEnabled = pref === null ? true : pref.email_enabled;

  if (emailEnabled) {
    const { data: authData } = await admin.auth.admin.getUserById(params.user_id);
    const email = authData?.user?.email;
    if (email) {
      void sendNotificationEmail({
        to: email,
        type: params.type,
        titleAr: params.title_ar,
        titleEn: params.title_en,
        bodyAr: params.body_ar ?? params.title_ar,
        bodyEn: params.body_en ?? params.title_en,
        link: params.link,
        userId: params.user_id,
      });
    }
  }

  return { data: { id: notification.id }, error: null };
}

// ---------------------------------------------------------------------------
// MARK NOTIFICATION READ
// ---------------------------------------------------------------------------
export async function markNotificationRead(
  notificationId: string,
): Promise<ActionResult<{ read: boolean }>> {
  const t = await getTranslations('actions.notifications');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { error } = await db(supabase)
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) return { data: null, error: t('markReadError') };

  revalidatePath('/dashboard/notifications');
  return { data: { read: true }, error: null };
}

// ---------------------------------------------------------------------------
// MARK ALL NOTIFICATIONS READ
// ---------------------------------------------------------------------------
export async function markAllNotificationsRead(): Promise<ActionResult<{ read: boolean }>> {
  const t = await getTranslations('actions.notifications');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { error } = await db(supabase)
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) return { data: null, error: t('markAllReadError') };

  revalidatePath('/dashboard/notifications');
  return { data: { read: true }, error: null };
}

// ---------------------------------------------------------------------------
// UPDATE NOTIFICATION PREFERENCES
// ---------------------------------------------------------------------------
export async function updateNotificationPreferences(
  _prev: ActionResult<{ updated: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ updated: boolean }>> {
  const t = await getTranslations('actions.notifications');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const raw = {
    notification_type: formData.get('notification_type'),
    email_enabled: formData.get('email_enabled'),
  };
  const parsed = NotificationPreferenceSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const { notification_type, email_enabled } = parsed.data;

  // Prevent muting critical notifications
  if (CRITICAL_TYPES.includes(notification_type as NotificationType) && !email_enabled) {
    return { data: null, error: t('cannotMuteCritical') };
  }

  // Upsert preference
  const { error } = await db(supabase)
    .from('notification_preferences')
    .upsert(
      {
        user_id: user.id,
        notification_type,
        email_enabled,
      },
      { onConflict: 'user_id,notification_type' },
    );

  if (error) return { data: null, error: t('updatePreferencesError') };

  revalidatePath('/dashboard/notifications');
  return { data: { updated: true }, error: null };
}

// ---------------------------------------------------------------------------
// GET UNREAD COUNT (helper for topbar/sidebar)
// ---------------------------------------------------------------------------
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await db(supabase)
    .from('notifications')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('is_read', false);

  return count ?? 0;
}

// ---------------------------------------------------------------------------
// GET UNREAD MESSAGE COUNT (helper for sidebar)
// ---------------------------------------------------------------------------
export async function getUnreadMessageCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data } = await db(supabase)
    .from('conversation_participants')
    .select('unread_count')
    .eq('user_id', user.id)
    .gt('unread_count', 0);

  if (!data) return 0;
  return data.reduce((sum: number, p: { unread_count: number }) => sum + p.unread_count, 0);
}

// ---------------------------------------------------------------------------
// BULK MARK NOTIFICATIONS READ
// ---------------------------------------------------------------------------
export async function bulkMarkNotificationsRead(
  ids: string[],
): Promise<ActionResult<{ updated: number }>> {
  const t = await getTranslations('actions.notifications');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };
  if (!ids.length) return { data: { updated: 0 }, error: null };

  const { count, error } = await db(supabase)
    .from('notifications')
    .update({ is_read: true }, { count: 'exact' })
    .in('id', ids)
    .eq('user_id', user.id);

  if (error) return { data: null, error: t('markReadError') };

  revalidatePath('/dashboard/notifications');
  return { data: { updated: count ?? 0 }, error: null };
}

// ---------------------------------------------------------------------------
// BULK DELETE NOTIFICATIONS
// ---------------------------------------------------------------------------
export async function bulkDeleteNotifications(
  ids: string[],
): Promise<ActionResult<{ deleted: number }>> {
  const t = await getTranslations('actions.notifications');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };
  if (!ids.length) return { data: { deleted: 0 }, error: null };

  const { count, error } = await db(supabase)
    .from('notifications')
    .delete({ count: 'exact' })
    .in('id', ids)
    .eq('user_id', user.id);

  if (error) return { data: null, error: t('deleteError') };

  revalidatePath('/dashboard/notifications');
  return { data: { deleted: count ?? 0 }, error: null };
}

// ---------------------------------------------------------------------------
// NOTIFICATION RECORD TYPE (used by dropdown + hook)
// ---------------------------------------------------------------------------
export interface NotificationRecord {
  id: string;
  type: string;
  title_ar: string;
  title_en: string;
  body_ar: string | null;
  body_en: string | null;
  link: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// GET RECENT NOTIFICATIONS (for dropdown)
// ---------------------------------------------------------------------------
export async function getRecentNotifications(): Promise<ActionResult<NotificationRecord[]>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'mustLogin' };

  const { data, error } = await db(supabase)
    .from('notifications')
    .select(
      'id, type, title_ar, title_en, body_ar, body_en, link, entity_type, entity_id, is_read, created_at',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(15);

  if (error) return { data: null, error: 'fetchError' };
  return { data: data ?? [], error: null };
}
