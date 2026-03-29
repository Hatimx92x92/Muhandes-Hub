'use server';

import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import {
  SubscribeSchema,
  ApplyCouponSchema,
  UpgradeSubscriptionSchema,
  DowngradeSubscriptionSchema,
  RenewSubscriptionSchema,
} from '@/schemas/subscription';
import type { ActionResult } from '@/types';
import { SUBSCRIPTION_PRICING, DURATION_DISCOUNTS, VAT_RATE } from '@/types';
import { createPaymentSession } from '@/lib/moyasar';
import { uploadFile } from '@/actions/uploads';

// =============================================================================
// Type helper for DB queries until types are generated
// =============================================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

// =============================================================================
// Tier ordering helper
// =============================================================================
const TIER_ORDER = { starter: 0, pro: 1, business: 2, enterprise: 3 } as const;

function getTierIndex(tier: string): number {
  return TIER_ORDER[tier as keyof typeof TIER_ORDER] ?? 0;
}

// =============================================================================
// Price calculation helpers
// =============================================================================
function calculateSubscriptionPrice(tier: string, months: number, coupon?: { discount_type: string; discount_value: number } | null) {
  const baseMonthly = SUBSCRIPTION_PRICING[tier as keyof typeof SUBSCRIPTION_PRICING]?.monthly ?? 0;
  const durationDiscount = DURATION_DISCOUNTS[months as keyof typeof DURATION_DISCOUNTS] ?? 0;
  let subtotal = baseMonthly * months * (1 - durationDiscount);

  // Apply coupon discount after duration discount
  if (coupon) {
    if (coupon.discount_type === 'percentage') {
      subtotal = subtotal * (1 - coupon.discount_value / 100);
    } else if (coupon.discount_type === 'fixed') {
      subtotal = Math.max(0, subtotal - coupon.discount_value);
    }
  }

  const vatAmount = subtotal * VAT_RATE;
  const total = subtotal + vatAmount;
  return { subtotal, vatAmount, total };
}

function getCallbackUrl(locale: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/${locale}/dashboard/subscription/payment-result`;
}

// =============================================================================
// subscribe — create a new subscription
// =============================================================================

export async function subscribe(
  _prevState: ActionResult<{ subscriptionId: string; requiresPayment: boolean; paymentUrl?: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ subscriptionId: string; requiresPayment: boolean; paymentUrl?: string }>> {
  const t = await getTranslations('actions.subscriptions');
  // 1. Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: t('mustLogin') };
  }

  // 2. Validate
  const raw = {
    tier: formData.get('tier') as string,
    duration_months: formData.get('duration_months') as string,
    coupon_code: formData.get('coupon_code') as string || undefined,
  };

  const result = SubscribeSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { data: null, error: t('validationError'), fieldErrors };
  }

  const { tier, duration_months, coupon_code } = result.data;
  const months = parseInt(duration_months);

  // 3. Calculate price
  const baseMonthly = SUBSCRIPTION_PRICING[tier as keyof typeof SUBSCRIPTION_PRICING]?.monthly ?? 0;
  const durationDiscount = DURATION_DISCOUNTS[months as keyof typeof DURATION_DISCOUNTS] ?? 0;
  const subtotal = baseMonthly * months * (1 - durationDiscount);
  const vatAmount = subtotal * VAT_RATE;
  const total = subtotal + vatAmount;

  // Free tier — no payment needed
  if (tier === 'starter' || total === 0) {
    // Create a free subscription record
    const expiresAtFree = tier === 'starter' ? null : (() => { const d = new Date(); d.setMonth(d.getMonth() + months); return d.toISOString(); })();
    const { data: freeSub, error: freeInsertError } = await db(supabase)
      .from('subscriptions')
      .insert({
        user_id: user.id,
        tier,
        duration_months: months,
        base_price: 0,
        duration_discount: 0,
        coupon_discount: 0,
        final_price: 0,
        payment_status: 'completed',
        payment_method: 'card',
        is_active: true,
        starts_at: new Date().toISOString(),
        expires_at: expiresAtFree,
      })
      .select('id')
      .single();

    if (freeInsertError || !freeSub) {
      return { data: null, error: t('activationError') };
    }

    return {
      data: { subscriptionId: freeSub.id as string, requiresPayment: false },
      error: null,
    };
  }

  // 4. Paid tier — create pending subscription record + Moyasar payment

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  const { data: insertData, error: insertError } = await db(supabase)
    .from('subscriptions')
    .insert({
      user_id: user.id,
      tier,
      duration_months: months,
      base_price: subtotal,
      duration_discount: subtotal - (baseMonthly * months),
      final_price: total,
      payment_status: 'pending',
      payment_method: 'card',
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single();

  if (insertError || !insertData) {
    return { data: null, error: t('subscriptionCreateError') };
  }

  const subscriptionId = insertData.id as string;

  // Create Moyasar payment session for card payments
  try {
    const locale = (formData.get('locale') as string) || 'ar';
    const { paymentUrl } = await createPaymentSession({
      amount: total,
      description: `Muhandes HUB — ${tier} subscription (${months} months)`,
      callbackUrl: getCallbackUrl(locale),
      metadata: {
        type: 'subscription',
        action: 'new',
        subscription_id: subscriptionId,
        user_id: user.id,
      },
    });

    return {
      data: { subscriptionId, requiresPayment: true, paymentUrl },
      error: null,
    };
  } catch {
    // If Moyasar fails, subscription is still created as pending_payment
    // User can retry or admin can manually resolve
    return {
      data: { subscriptionId, requiresPayment: true },
      error: null,
    };
  }
}

// =============================================================================
// applyCoupon — validate and return discount info for a coupon
// =============================================================================

export async function applyCoupon(
  _prevState: ActionResult<{ discount_type: string; discount_value: number }> | null,
  formData: FormData,
): Promise<ActionResult<{ discount_type: string; discount_value: number }>> {
  const t = await getTranslations('actions.subscriptions');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: t('mustLogin') };
  }

  const raw = {
    coupon_code: formData.get('coupon_code') as string,
    tier: formData.get('tier') as string,
  };

  const result = ApplyCouponSchema.safeParse(raw);
  if (!result.success) {
    return { data: null, error: t('invalidCoupon') };
  }

  // Look up coupon in DB
  const { data: coupon, error: couponError } = await db(supabase)
    .from('coupons')
    .select('id, code, discount_type, discount_value, max_uses, current_uses, valid_from, valid_until, applicable_tiers')
    .eq('code', result.data.coupon_code)
    .single();

  if (couponError || !coupon) {
    return { data: null, error: t('couponNotFound') };
  }

  // Check validity
  const now = new Date().toISOString();
  if (coupon.valid_from && now < (coupon.valid_from as string)) {
    return { data: null, error: t('couponNotActiveYet') };
  }
  if (coupon.valid_until && now > (coupon.valid_until as string)) {
    return { data: null, error: t('couponExpired') };
  }
  if (coupon.max_uses && (coupon.current_uses as number) >= (coupon.max_uses as number)) {
    return { data: null, error: t('couponExhausted') };
  }

  return {
    data: {
      discount_type: coupon.discount_type as string,
      discount_value: coupon.discount_value as number,
    },
    error: null,
  };
}

// =============================================================================
// upgradeSubscription — upgrade to a higher tier (prorated)
// =============================================================================

export async function upgradeSubscription(
  _prevState: ActionResult<{ paymentUrl?: string; credit: number; newTotal: number }> | null,
  formData: FormData,
): Promise<ActionResult<{ paymentUrl?: string; credit: number; newTotal: number }>> {
  const t = await getTranslations('actions.subscriptions');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: t('mustLogin') };
  }

  // Validate input
  const raw = {
    new_tier: formData.get('new_tier') as string,
    duration_months: formData.get('duration_months') as string,
    coupon_code: (formData.get('coupon_code') as string) || undefined,
    payment_method: formData.get('payment_method') as string,
  };

  const result = UpgradeSubscriptionSchema.safeParse(raw);
  if (!result.success) {
    return { data: null, error: t('validationErrors') };
  }

  const { new_tier, duration_months, payment_method } = result.data;
  const months = parseInt(duration_months);

  // Fetch current active subscription
  const { data: currentSub } = await db(supabase)
    .from('subscriptions')
    .select('id, tier, expires_at, final_price, duration_months, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const currentTier = (currentSub?.tier as string) || 'starter';

  // Verify this is an upgrade
  if (getTierIndex(new_tier) <= getTierIndex(currentTier)) {
    return { data: null, error: t('mustUpgradeToHigherTier') };
  }

  // Calculate proration credit from remaining time on current plan
  let credit = 0;
  if (currentSub && currentSub.expires_at) {
    const now = new Date();
    const expiresAt = new Date(currentSub.expires_at as string);
    const remainingMs = Math.max(0, expiresAt.getTime() - now.getTime());
    const remainingDays = remainingMs / (1000 * 60 * 60 * 24);

    const currentDuration = (currentSub.duration_months as number) || 1;
    const totalDays = currentDuration * 30; // Approximate month = 30 days
    const dailyRate = (currentSub.final_price as number) / totalDays;
    credit = Math.round(dailyRate * remainingDays * 100) / 100; // Round to 2 decimals
  }

  // Calculate new subscription price
  const { subtotal, vatAmount, total: rawTotal } = calculateSubscriptionPrice(new_tier, months);
  const total = Math.max(0, rawTotal - credit); // Apply credit, minimum SAR 0

  // Create new pending subscription
  const newExpiresAt = new Date();
  newExpiresAt.setMonth(newExpiresAt.getMonth() + months);

  const { data: newSub, error: insertError } = await db(supabase)
    .from('subscriptions')
    .insert({
      user_id: user.id,
      tier: new_tier,
      duration_months: months,
      base_price: subtotal,
      duration_discount: 0,
      coupon_discount: 0,
      final_price: total,
      payment_status: 'pending',
      payment_method,
      is_active: false,
      starts_at: new Date().toISOString(),
      expires_at: newExpiresAt.toISOString(),
    })
    .select('id')
    .single();

  if (insertError || !newSub) {
    return { data: null, error: t('subscriptionCreateError') };
  }

  const subscriptionId = newSub.id as string;

  // Insert subscription history record
  await db(supabase).from('subscription_history').insert({
    user_id: user.id,
    subscription_id: subscriptionId,
    action: 'upgraded',
    previous_tier: currentTier,
    new_tier,
  });

  // Free upgrade (credit covers full cost) — activate immediately
  if (total === 0) {
    if (currentSub) {
      await db(supabase).from('subscriptions').update({ is_active: false }).eq('id', currentSub.id);
    }
    await db(supabase).from('subscriptions').update({ payment_status: 'completed', is_active: true }).eq('id', subscriptionId);

    // Notify user of free upgrade
    try {
      const { notifySubscriptionUpgraded } = await import('@/actions/notification-triggers');
      await notifySubscriptionUpgraded({ userId: user.id, newTier: new_tier });
    } catch { /* non-critical */ }

    return { data: { credit, newTotal: 0 }, error: null };
  }

  if (payment_method === 'bank_transfer') {
    // Upload receipt if provided
    const receiptFile = formData.get('bank_receipt') as File | null;
    if (receiptFile && receiptFile.size > 0) {
      const uploadResult = await uploadFile('bank-payments', receiptFile, `upgrade-${subscriptionId}`);
      if (uploadResult.data?.url) {
        await db(supabase)
          .from('profiles')
          .update({ bank_receipt_url: uploadResult.data.url })
          .eq('id', user.id);
      }
    }
    // Bank transfer — subscription stays pending; admin verifies manually
    return { data: { credit, newTotal: total }, error: null };
  }

  // Card payment — create Moyasar session
  try {
    const locale = (formData.get('locale') as string) || 'ar';
    const { paymentUrl } = await createPaymentSession({
      amount: total,
      description: `Muhandes HUB — Upgrade to ${new_tier} (${months} months)`,
      callbackUrl: getCallbackUrl(locale),
      metadata: {
        type: 'subscription',
        action: 'upgrade',
        subscription_id: subscriptionId,
        previous_subscription_id: currentSub?.id || '',
        user_id: user.id,
      },
    });

    return { data: { paymentUrl, credit, newTotal: total }, error: null };
  } catch {
    return { data: { credit, newTotal: total }, error: null };
  }
}

// =============================================================================
// downgradeSubscription — schedule downgrade at end of current period
// =============================================================================

export async function downgradeSubscription(
  _prevState: ActionResult<{ effectiveDate: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ effectiveDate: string }>> {
  const t = await getTranslations('actions.subscriptions');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: t('mustLogin') };
  }

  const raw = { new_tier: formData.get('new_tier') as string };
  const result = DowngradeSubscriptionSchema.safeParse(raw);
  if (!result.success) {
    return { data: null, error: t('validationErrors') };
  }

  const { new_tier } = result.data;

  // Fetch current active subscription
  const { data: currentSub } = await db(supabase)
    .from('subscriptions')
    .select('id, tier, expires_at')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!currentSub) {
    return { data: null, error: t('noActiveSubscription') };
  }

  const currentTier = currentSub.tier as string;

  // Verify this is a downgrade
  if (getTierIndex(new_tier) >= getTierIndex(currentTier)) {
    return { data: null, error: t('mustDowngradeToLowerTier') };
  }

  const effectiveDate = (currentSub.expires_at as string) || new Date().toISOString();

  // Insert subscription history record to schedule downgrade
  await db(supabase).from('subscription_history').insert({
    user_id: user.id,
    subscription_id: currentSub.id as string,
    action: 'downgraded',
    previous_tier: currentTier,
    new_tier,
    details: { scheduled: true, effective_date: effectiveDate },
  });

  return { data: { effectiveDate }, error: null };
}

// =============================================================================
// renewSubscription — renew current tier with new duration
// =============================================================================

export async function renewSubscription(
  _prevState: ActionResult<{ paymentUrl?: string; total: number }> | null,
  formData: FormData,
): Promise<ActionResult<{ paymentUrl?: string; total: number }>> {
  const t = await getTranslations('actions.subscriptions');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: t('mustLogin') };
  }

  const raw = {
    duration_months: formData.get('duration_months') as string,
    coupon_code: (formData.get('coupon_code') as string) || undefined,
    payment_method: formData.get('payment_method') as string,
  };

  const result = RenewSubscriptionSchema.safeParse(raw);
  if (!result.success) {
    return { data: null, error: t('validationErrors') };
  }

  const { duration_months, payment_method } = result.data;
  const months = parseInt(duration_months);

  // Fetch current active subscription to determine tier
  const { data: activeSub } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const currentTier = (activeSub?.tier as string) || 'starter';

  if (currentTier === 'starter') {
    return { data: null, error: t('cannotRenewStarter') };
  }

  // Calculate price
  const { subtotal, vatAmount, total } = calculateSubscriptionPrice(currentTier, months);

  // Determine new expiry — extend from current expiry or start from now
  const { data: currentSub } = await db(supabase)
    .from('subscriptions')
    .select('id, expires_at')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const startFrom = currentSub?.expires_at && new Date(currentSub.expires_at as string) > new Date()
    ? new Date(currentSub.expires_at as string)
    : new Date();

  const newExpiresAt = new Date(startFrom);
  newExpiresAt.setMonth(newExpiresAt.getMonth() + months);

  const { data: newSub, error: insertError } = await db(supabase)
    .from('subscriptions')
    .insert({
      user_id: user.id,
      tier: currentTier,
      duration_months: months,
      base_price: subtotal,
      duration_discount: 0,
      coupon_discount: 0,
      final_price: total,
      payment_status: 'pending',
      payment_method,
      starts_at: startFrom.toISOString(),
      expires_at: newExpiresAt.toISOString(),
    })
    .select('id')
    .single();

  if (insertError || !newSub) {
    return { data: null, error: t('subscriptionCreateError') };
  }

  const subscriptionId = newSub.id as string;

  // Insert subscription history record
  await db(supabase).from('subscription_history').insert({
    user_id: user.id,
    subscription_id: subscriptionId,
    action: 'renewed',
    previous_tier: currentTier,
    new_tier: currentTier,
  });

  if (payment_method === 'bank_transfer') {
    // Upload receipt if provided
    const receiptFile = formData.get('bank_receipt') as File | null;
    if (receiptFile && receiptFile.size > 0) {
      const uploadResult = await uploadFile('bank-payments', receiptFile, `renew-${subscriptionId}`);
      if (uploadResult.data?.url) {
        await db(supabase)
          .from('profiles')
          .update({ bank_receipt_url: uploadResult.data.url })
          .eq('id', user.id);
      }
    }
    return { data: { total }, error: null };
  }

  // Card payment — create Moyasar session
  try {
    const locale = (formData.get('locale') as string) || 'ar';
    const { paymentUrl } = await createPaymentSession({
      amount: total,
      description: `Muhandes HUB — Renew ${currentTier} (${months} months)`,
      callbackUrl: getCallbackUrl(locale),
      metadata: {
        type: 'subscription',
        action: 'renewal',
        subscription_id: subscriptionId,
        user_id: user.id,
      },
    });

    return { data: { paymentUrl, total }, error: null };
  } catch {
    return { data: { total }, error: null };
  }
}

// =============================================================================
// getInvoices — fetch invoice history for the current user
// =============================================================================

export interface InvoiceRecord {
  id: string;
  type: 'commission' | 'subscription';
  number: string;
  subtotal: number;
  vat: number;
  total: number;
  issued_at: string;
  // Enrichment from joins
  reference_label?: string; // e.g. tier name or deal title
}

export async function getInvoices(
  type?: 'commission' | 'subscription',
): Promise<ActionResult<InvoiceRecord[]>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Unauthorized' };
  }

  let query = db(supabase)
    .from('invoices')
    .select('id, type, number, reference_id, subtotal, vat, total, issued_at')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }

  const { data: invoices, error } = await query;

  if (error) {
    return { data: null, error: 'Failed to fetch invoices' };
  }

  if (!invoices || invoices.length === 0) {
    return { data: [], error: null };
  }

  // Enrich with reference labels
  const enriched: InvoiceRecord[] = [];

  // Collect reference IDs by type for batch lookup
  const subIds = invoices
    .filter((inv: { type: string }) => inv.type === 'subscription')
    .map((inv: { reference_id: string }) => inv.reference_id);
  const commissionIds = invoices
    .filter((inv: { type: string }) => inv.type === 'commission')
    .map((inv: { reference_id: string }) => inv.reference_id);

  // Batch fetch subscription tiers
  let subMap: Record<string, string> = {};
  if (subIds.length > 0) {
    const { data: subs } = await db(supabase)
      .from('subscriptions')
      .select('id, tier, duration_months')
      .in('id', subIds);
    if (subs) {
      for (const s of subs) {
        const tierName = (s.tier as string).charAt(0).toUpperCase() + (s.tier as string).slice(1);
        subMap[s.id] = `${tierName} (${s.duration_months}mo)`;
      }
    }
  }

  // Batch fetch commission deal titles
  let commissionMap: Record<string, string> = {};
  if (commissionIds.length > 0) {
    const { data: comms } = await db(supabase)
      .from('commissions')
      .select('id, deal_id')
      .in('id', commissionIds);
    if (comms && comms.length > 0) {
      const dealIds = comms.map((c: { deal_id: string }) => c.deal_id);
      const { data: deals } = await db(supabase)
        .from('deals')
        .select('id, title_slug')
        .in('id', dealIds);
      const dealMap: Record<string, string> = {};
      if (deals) {
        for (const d of deals) {
          dealMap[d.id] = d.title_slug || d.id.slice(0, 8);
        }
      }
      for (const c of comms) {
        commissionMap[c.id] = dealMap[c.deal_id] || c.deal_id.slice(0, 8);
      }
    }
  }

  for (const inv of invoices) {
    enriched.push({
      id: inv.id,
      type: inv.type,
      number: inv.number,
      subtotal: Number(inv.subtotal),
      vat: Number(inv.vat),
      total: Number(inv.total),
      issued_at: inv.issued_at,
      reference_label:
        inv.type === 'subscription'
          ? subMap[inv.reference_id] || 'Subscription'
          : commissionMap[inv.reference_id] || 'Commission',
    });
  }

  return { data: enriched, error: null };
}
