// =============================================================================
// Muqawil HUB — Commission Server Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { PayCommissionSchema, DisputeCommissionSchema } from '@/schemas/review';
import type { ActionResult } from '@/types';
import { VAT_RATE } from '@/types';
import { notifyCommissionDue } from '@/actions/notification-triggers';

const COMMISSION_RATES: Record<string, number> = {
  starter: 0.02,
  pro: 0.01,
  business: 0,
  enterprise: 0,
};

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
// PAY COMMISSION
// ---------------------------------------------------------------------------
export async function payCommission(
  _prevState: ActionResult<{ status: string; paymentUrl?: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ status: string; paymentUrl?: string }>> {
  const t = await getTranslations('actions.commissions');
  // 1. Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // 2. Parse & validate
  const raw = {
    commission_id: formData.get('commission_id'),
    method: formData.get('method'),
  };

  const result = PayCommissionSchema.safeParse(raw);
  if (!result.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(result.error.issues) };
  }

  const data = result.data;

  // 3. Fetch commission & verify seller
  const { data: commission, error: fetchError } = await db(supabase)
    .from('commissions')
    .select('*')
    .eq('id', data.commission_id)
    .single();

  if (fetchError || !commission) {
    return { data: null, error: t('commissionNotFound') };
  }

  if (commission.seller_id !== user.id) {
    return { data: null, error: t('noPermissionPay') };
  }

  // 4. Check commission is payable
  if (!['pending', 'overdue'].includes(commission.status)) {
    return { data: null, error: t('notPayable') };
  }

  // 5. Process by payment method
  if (data.method === 'card') {
    // TODO: Integrate Moyasar payment gateway
    // 1. Create Moyasar payment session with commission.total
    // 2. Return payment URL for client redirect
    // 3. Moyasar webhook will confirm payment and update status

    // Placeholder: mark as approved (awaiting Moyasar integration)
    await db(supabase)
      .from('commissions')
      .update({
        payment_method: 'card',
        status: 'approved',
      })
      .eq('id', data.commission_id);

    revalidatePath('/dashboard/commissions');
    return {
      data: {
        status: 'approved',
        // paymentUrl: moyasarSession.url  // TODO: real URL from Moyasar
      },
      error: null,
    };
  }

  if (data.method === 'bank_transfer') {
    // Bank transfer: update method, receipt will be uploaded separately by admin verification
    await db(supabase)
      .from('commissions')
      .update({
        payment_method: 'bank_transfer',
        status: 'approved',
      })
      .eq('id', data.commission_id);

    revalidatePath('/dashboard/commissions');
    return {
      data: { status: 'approved' },
      error: null,
    };
  }

  return { data: null, error: t('unknownPaymentMethod') };
}

// ---------------------------------------------------------------------------
// DISPUTE COMMISSION — within 7 days of creation
// ---------------------------------------------------------------------------
export async function disputeCommission(
  _prevState: ActionResult<{ disputed: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ disputed: boolean }>> {
  const t = await getTranslations('actions.commissions');
  // 1. Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // 2. Parse & validate
  const raw = {
    commission_id: formData.get('commission_id'),
    reason: formData.get('reason'),
  };

  const result = DisputeCommissionSchema.safeParse(raw);
  if (!result.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(result.error.issues) };
  }

  const data = result.data;

  // 3. Fetch commission & verify seller
  const { data: commission, error: fetchError } = await db(supabase)
    .from('commissions')
    .select('*')
    .eq('id', data.commission_id)
    .single();

  if (fetchError || !commission) {
    return { data: null, error: t('commissionNotFound') };
  }

  if (commission.seller_id !== user.id) {
    return { data: null, error: t('noPermissionDispute') };
  }

  // 4. Check commission is disputable (pending or overdue, not already disputed/paid)
  if (!['pending', 'overdue'].includes(commission.status)) {
    return { data: null, error: t('cannotDispute') };
  }

  // 5. Check within 7-day dispute window from creation
  const createdAt = new Date(commission.created_at);
  const sevenDaysLater = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (new Date() > sevenDaysLater) {
    return { data: null, error: t('disputeWindowExpired') };
  }

  // 6. Update commission status to disputed, freeze deadline
  const { error: updateError } = await db(supabase)
    .from('commissions')
    .update({
      status: 'disputed',
      dispute_reason: data.reason,
      dispute_raised_at: new Date().toISOString(),
    })
    .eq('id', data.commission_id);

  if (updateError) {
    return { data: null, error: t('disputeError') };
  }

  // 7. Side effects: notify admin
  // TODO: createNotification for admin about dispute

  revalidatePath('/dashboard/commissions');

  return { data: { disputed: true }, error: null };
}

// ---------------------------------------------------------------------------
// CREATE COMMISSION FOR DEAL — Auto-calculated at deal creation time
// Called internally from bid award / quotation acceptance / RFQ response acceptance
// ---------------------------------------------------------------------------
export async function createCommissionForDeal(params: {
  dealId: string;
  sellerId: string;
  dealValue: number;
}): Promise<ActionResult<{ commissionId: string; amount: number }>> {
  const supabase = await createClient();

  // Get seller tier
  const { data: seller } = await db(supabase)
    .from('profiles')
    .select('subscription_tier')
    .eq('id', params.sellerId)
    .single();

  const tier = (seller?.subscription_tier || 'starter') as string;
  const rate = COMMISSION_RATES[tier] ?? 0.02;

  // Business/Enterprise: 0% commission
  if (rate === 0) {
    return { data: { commissionId: '', amount: 0 }, error: null };
  }

  const commissionNet = params.dealValue * rate;
  const commissionVat = commissionNet * VAT_RATE; // ZATCA 15%
  const commissionTotal = commissionNet + commissionVat;

  // Due date: 14 days from now
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  const { data: commission, error } = await db(supabase)
    .from('commissions')
    .insert({
      deal_id: params.dealId,
      seller_id: params.sellerId,
      rate: rate * 100,
      net_amount: commissionNet,
      vat_amount: commissionVat,
      total: commissionTotal,
      due_date: dueDate.toISOString(),
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !commission) {
    return { data: null, error: 'Failed to create commission record' };
  }

  // Notify seller
  const { data: deal } = await db(supabase)
    .from('deals')
    .select('title_slug')
    .eq('id', params.dealId)
    .single();

  notifyCommissionDue({
    sellerId: params.sellerId,
    amount: commissionTotal,
    dealNumber: deal?.title_slug || params.dealId.slice(0, 8),
    commissionId: commission.id,
  }).catch(() => {});

  return {
    data: { commissionId: commission.id, amount: commissionTotal },
    error: null,
  };
}
