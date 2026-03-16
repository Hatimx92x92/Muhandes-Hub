// =============================================================================
// Muqawil HUB — Admin Commission Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import type { ActionResult } from '@/types';
import { VAT_RATE } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

async function verifyAdmin(): Promise<{ adminId: string } | { error: string }> {
  const t = await getTranslations('actions.adminCommissions');
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
// APPROVE COMMISSION PAYMENT (bank transfer receipt verified)
// ---------------------------------------------------------------------------
export async function approveCommissionPayment(
  commissionId: string,
): Promise<ActionResult<{ invoiceId?: string }>> {
  const t = await getTranslations('actions.adminCommissions');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  // Fetch commission
  const { data: commission, error: fetchError } = await db(adminClient)
    .from('commissions')
    .select('*')
    .eq('id', commissionId)
    .single();

  if (fetchError || !commission) return { data: null, error: t('commissionNotFound') };
  if (commission.status === 'paid') return { data: null, error: t('alreadyPaid') };

  // Update status → paid
  const { error: updateError } = await db(adminClient)
    .from('commissions')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      resolved_by: auth.adminId,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', commissionId);

  if (updateError) return { data: null, error: t('approveError') };

  // Create invoice record
  const { data: invoice } = await db(adminClient).from('invoices').insert({
    user_id: commission.seller_id,
    type: 'commission',
    reference_id: commissionId,
    subtotal: commission.amount,
    vat: commission.vat_amount,
    total: commission.total,
    issued_at: new Date().toISOString(),
  }).select('id').single();

  // TODO: Generate ZATCA-compliant PDF

  await logAudit(auth.adminId, 'approve_commission_payment', 'commission', commissionId);
  revalidatePath('/admin/commissions');

  return { data: { invoiceId: invoice?.id }, error: null };
}

// ---------------------------------------------------------------------------
// RESOLVE COMMISSION DISPUTE
// ---------------------------------------------------------------------------
export async function resolveCommissionDispute(
  commissionId: string,
  resolution: string,
  adjustedAmount?: number,
): Promise<ActionResult<{ resolved: boolean }>> {
  const t = await getTranslations('actions.adminCommissions');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  // Fetch commission
  const { data: commission, error: fetchError } = await db(adminClient)
    .from('commissions')
    .select('*')
    .eq('id', commissionId)
    .single();

  if (fetchError || !commission) return { data: null, error: t('commissionNotFound') };
  if (commission.status !== 'disputed') return { data: null, error: t('notDisputed') };

  // Build update: adjust amount if provided, set new due date, unfreeze
  const updates: Record<string, unknown> = {
    status: 'pending',
    resolved_by: auth.adminId,
    resolved_at: new Date().toISOString(),
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // new 14-day window
  };

  if (adjustedAmount !== undefined && adjustedAmount >= 0) {
    const vatAmount = Math.round(adjustedAmount * VAT_RATE * 100) / 100;
    updates.amount = adjustedAmount;
    updates.vat_amount = vatAmount;
    updates.total = adjustedAmount + vatAmount;
  }

  const { error: updateError } = await db(adminClient)
    .from('commissions')
    .update(updates)
    .eq('id', commissionId);

  if (updateError) return { data: null, error: t('resolveError') };

  await logAudit(auth.adminId, 'resolve_commission_dispute', 'commission', commissionId, {
    resolution,
    adjustedAmount,
  });
  revalidatePath('/admin/commissions');

  return { data: { resolved: true }, error: null };
}
