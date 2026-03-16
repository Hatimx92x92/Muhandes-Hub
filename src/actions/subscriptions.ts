'use server';

import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { SubscribeSchema, ApplyCouponSchema } from '@/schemas/subscription';
import type { ActionResult } from '@/types';
import { SUBSCRIPTION_PRICING, DURATION_DISCOUNTS, VAT_RATE } from '@/types';

// =============================================================================
// Type helper for DB queries until types are generated
// =============================================================================
function db(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (f: string, v: string) => {
          single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
          gte: (f2: string, v2: string) => {
            lte: (f3: string, v3: string) => Promise<{ data: Record<string, unknown>[] | null; count: number | null; error: { message: string } | null }>;
          };
        };
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
      insert: (d: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
      update: (d: Record<string, unknown>) => {
        eq: (f: string, v: string) => Promise<{ error: { message: string } | null }>;
      };
    };
  };
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
    // Update profile subscription tier
    const { error: updateError } = await db(supabase)
      .from('profiles')
      .update({
        subscription_tier: tier,
        subscription_expires_at: null, // Starter never expires
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return { data: null, error: t('activationError') };
    }

    return {
      data: { subscriptionId: `sub_${Date.now()}`, requiresPayment: false },
      error: null,
    };
  }

  // 4. Paid tier — create pending subscription record
  // TODO: Create Moyasar payment session and return paymentUrl
  // For now, create a pending subscription that activates after payment

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  const { error: insertError } = await db(supabase)
    .from('subscriptions')
    .insert({
      user_id: user.id,
      tier,
      duration_months: months,
      amount_net: subtotal,
      amount_vat: vatAmount,
      amount_total: total,
      coupon_code: coupon_code || null,
      status: 'pending_payment',
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    });

  if (insertError) {
    return { data: null, error: t('createError') };
  }

  return {
    data: {
      subscriptionId: `sub_${Date.now()}`,
      requiresPayment: true,
      // paymentUrl will be populated once Moyasar integration is complete
    },
    error: null,
  };
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
