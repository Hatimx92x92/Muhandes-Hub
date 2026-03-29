// =============================================================================
// Muhandes HUB — Admin Subscription Actions
// =============================================================================
// ⚠️ All actions require is_admin = true. Uses Admin client for bypassing RLS.
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { VAT_RATE, type ActionResult } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

async function verifyAdmin(): Promise<{ adminId: string } | { error: string }> {
  const t = await getTranslations('actions.adminSubscriptions');
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
// CHANGE USER SUBSCRIPTION TIER
// ---------------------------------------------------------------------------
export async function changeUserSubscription(
  userId: string,
  newTier: string,
  reason: string,
): Promise<ActionResult<{ updated: boolean }>> {
  const t = await getTranslations('actions.adminSubscriptions');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  // Find the user's active subscription
  const { data: sub } = await db(adminClient)
    .from('subscriptions')
    .select('id, tier')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (sub) {
    // Update existing subscription tier
    const { error } = await db(adminClient)
      .from('subscriptions')
      .update({ tier: newTier })
      .eq('id', sub.id);

    if (error) return { data: null, error: t('updateError') };
  } else {
    // Create a new subscription
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { error } = await db(adminClient)
      .from('subscriptions')
      .insert({
        user_id: userId,
        tier: newTier,
        is_active: true,
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        final_price: 0,
        base_price: 0,
      });

    if (error) return { data: null, error: t('createError') };
  }

  await logAudit(auth.adminId, 'change_subscription', 'user', userId, {
    new_tier: newTier,
    previous_tier: sub?.tier ?? 'none',
    reason,
  });

  revalidatePath('/admin/subscriptions');
  revalidatePath('/admin/users');

  return { data: { updated: true }, error: null };
}

// ---------------------------------------------------------------------------
// EXTEND USER SUBSCRIPTION
// ---------------------------------------------------------------------------
export async function extendUserSubscription(
  userId: string,
  days: number,
  reason: string,
): Promise<ActionResult<{ extended: boolean }>> {
  const t = await getTranslations('actions.adminSubscriptions');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  if (days < 1 || days > 365) return { data: null, error: t('invalidDays') };

  const adminClient = createAdminClient();

  const { data: sub } = await db(adminClient)
    .from('subscriptions')
    .select('id, expires_at')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!sub) return { data: null, error: t('noSubscription') };

  const currentExpiry = new Date(sub.expires_at);
  currentExpiry.setDate(currentExpiry.getDate() + days);

  const { error } = await db(adminClient)
    .from('subscriptions')
    .update({ expires_at: currentExpiry.toISOString() })
    .eq('id', sub.id);

  if (error) return { data: null, error: t('extendError') };

  await logAudit(auth.adminId, 'extend_subscription', 'user', userId, {
    days,
    new_expiry: currentExpiry.toISOString(),
    reason,
  });

  revalidatePath('/admin/subscriptions');
  return { data: { extended: true }, error: null };
}

// ---------------------------------------------------------------------------
// CANCEL USER SUBSCRIPTION
// ---------------------------------------------------------------------------
export async function cancelUserSubscription(
  userId: string,
  reason: string,
): Promise<ActionResult<{ cancelled: boolean }>> {
  const t = await getTranslations('actions.adminSubscriptions');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  const { data: sub } = await db(adminClient)
    .from('subscriptions')
    .select('id, tier')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!sub) return { data: null, error: t('noSubscription') };

  const { error } = await db(adminClient)
    .from('subscriptions')
    .update({ is_active: false })
    .eq('id', sub.id);

  if (error) return { data: null, error: t('cancelError') };

  await logAudit(auth.adminId, 'cancel_subscription', 'user', userId, {
    tier: sub.tier,
    reason,
  });

  revalidatePath('/admin/subscriptions');
  revalidatePath('/admin/users');

  return { data: { cancelled: true }, error: null };
}

// ---------------------------------------------------------------------------
// APPROVE SUBSCRIPTION PAYMENT (bank transfer receipt verified)
// ---------------------------------------------------------------------------
export async function approveSubscriptionPayment(
  subscriptionId: string,
): Promise<ActionResult<{ invoiceId?: string }>> {
  const t = await getTranslations('actions.adminSubscriptions');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  // Fetch the pending subscription
  const { data: sub, error: fetchError } = await db(adminClient)
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single();

  if (fetchError || !sub) return { data: null, error: t('notFound') };
  if (sub.is_active && sub.payment_status === 'completed') {
    return { data: null, error: t('alreadyActive') };
  }

  const now = new Date().toISOString();

  // Deactivate any current active subscription for this user
  await db(adminClient)
    .from('subscriptions')
    .update({ is_active: false })
    .eq('user_id', sub.user_id)
    .eq('is_active', true)
    .neq('id', subscriptionId);

  // Activate the subscription
  const { error: updateError } = await db(adminClient)
    .from('subscriptions')
    .update({
      is_active: true,
      payment_status: 'completed',
      payment_method: 'bank_transfer',
      starts_at: now,
    })
    .eq('id', subscriptionId);

  if (updateError) return { data: null, error: t('updateError') };

  // Create invoice record
  const total = Number(sub.final_price || 0);
  const vat = total * VAT_RATE / (1 + VAT_RATE);
  const subtotal = total - vat;

  const { data: invoice } = await db(adminClient).from('invoices').insert({
    user_id: sub.user_id,
    type: 'subscription',
    reference_id: subscriptionId,
    subtotal,
    vat,
    total,
    issued_at: now,
  }).select('id').single();

  await logAudit(auth.adminId, 'approve_subscription_payment', 'subscription', subscriptionId, {
    tier: sub.tier,
    total,
    payment_method: 'bank_transfer',
  });

  // Notify user
  try {
    const { notifySubscriptionPaymentApproved } = await import('@/actions/notification-triggers');
    await notifySubscriptionPaymentApproved({ userId: sub.user_id as string, tier: sub.tier as string });
  } catch { /* non-critical */ }

  revalidatePath('/admin/subscriptions');
  revalidatePath('/admin/users');

  return { data: { invoiceId: invoice?.id }, error: null };
}
