// =============================================================================
// Muhandes HUB — Commission Server Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { PayCommissionSchema, DisputeCommissionSchema } from '@/schemas/review';
import type { ActionResult } from '@/types';
import { VAT_RATE, isFreeRole } from '@/types';
import { notifyCommissionDue } from '@/actions/notification-triggers';
import { createPaymentSession } from '@/lib/moyasar';
import { createNotification } from '@/actions/notifications';

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
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://muhandeshub.com';
    let paymentUrl: string;
    try {
      const session = await createPaymentSession({
        amount: commission.total,
        description: `Commission payment for deal`,
        callbackUrl: `${APP_URL}/dashboard/commissions`,
        metadata: {
          type: 'commission',
          commission_id: data.commission_id,
          user_id: user.id,
        },
      });
      paymentUrl = session.paymentUrl;
    } catch {
      return { data: null, error: t('paymentSessionError') };
    }

    await db(supabase)
      .from('commissions')
      .update({ payment_method: 'card' })
      .eq('id', data.commission_id);

    return { data: { status: 'pending_payment', paymentUrl }, error: null };
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

  // 7. Side effects: notify all admins about dispute
  void (async () => {
    try {
      const { data: admins } = await db(supabase).from('profiles').select('id').eq('is_admin', true);
      if (admins?.length) {
        await Promise.all(
          admins.map((admin: { id: string }) =>
            createNotification({
              user_id: admin.id,
              type: 'deal_flagged_review',
              title_ar: 'نزاع عمولة جديد',
              title_en: 'New Commission Dispute',
              body_ar: `تم رفع نزاع على عمولة بقيمة ${commission.total} ريال`,
              body_en: `A dispute was raised on a commission of SAR ${commission.total}`,
              link: '/admin/commissions',
              entity_type: 'commission',
              entity_id: data.commission_id,
            }),
          ),
        );
      }
    } catch { /* non-critical */ }
  })();

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

  // Free roles (project_owner, buyer) never pay commission
  const { data: sellerProfile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', params.sellerId)
    .single();

  if (sellerProfile && isFreeRole(sellerProfile.role)) {
    return { data: { commissionId: '', amount: 0 }, error: null };
  }

  // Get seller tier
  const { data: sellerSub } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', params.sellerId)
    .eq('is_active', true)
    .single();

  const tier = (sellerSub?.tier || 'starter') as string;
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
      deal_value: params.dealValue,
      rate: rate * 100,
      amount: commissionNet,
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
