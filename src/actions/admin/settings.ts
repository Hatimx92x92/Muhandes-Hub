// =============================================================================
// Muqawil HUB — Admin Settings & Coupon Actions
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
  const t = await getTranslations('actions.adminSettings');
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
// UPDATE PLATFORM SETTINGS
// ---------------------------------------------------------------------------
export async function updatePlatformSettings(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const t = await getTranslations('actions.adminSettings');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const key = formData.get('key') as string;
  const value = formData.get('value') as string;

  if (!key || !value) return { data: null, error: t('keyValueRequired') };

  const adminClient = createAdminClient();

  let jsonValue: unknown;
  try {
    jsonValue = JSON.parse(value);
  } catch {
    jsonValue = value;
  }

  const { error } = await db(adminClient)
    .from('platform_settings')
    .upsert({
      key,
      value: jsonValue,
      updated_by: auth.adminId,
      updated_at: new Date().toISOString(),
    });

  if (error) return { data: null, error: t('updateSettingError') };

  await logAudit(auth.adminId, 'update_setting', 'platform_settings', key, { value: jsonValue });
  revalidatePath('/admin/settings');

  return { data: undefined, error: null };
}

// ---------------------------------------------------------------------------
// MANAGE COUPON (create / update)
// ---------------------------------------------------------------------------
export async function manageCoupon(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.adminSettings');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const couponId = formData.get('coupon_id') as string | null;
  const code = (formData.get('code') as string)?.toUpperCase().trim();
  const discountType = formData.get('discount_type') as string;
  const discountValue = Number(formData.get('discount_value'));
  const maxDiscountCap = formData.get('max_discount_cap') ? Number(formData.get('max_discount_cap')) : null;
  const usageLimit = formData.get('usage_limit') ? Number(formData.get('usage_limit')) : null;
  const perUserLimit = Number(formData.get('per_user_limit') ?? 1);
  const validFrom = formData.get('valid_from') as string;
  const validTo = formData.get('valid_to') as string;
  const isActive = formData.get('is_active') === 'true';

  if (!code || !discountType || !discountValue || !validFrom || !validTo) {
    return { data: null, error: t('allFieldsRequired') };
  }

  const adminClient = createAdminClient();

  const couponData = {
    code,
    discount_type: discountType,
    discount_value: discountValue,
    max_discount_cap: maxDiscountCap,
    usage_limit: usageLimit,
    per_user_limit: perUserLimit,
    valid_from: validFrom,
    valid_to: validTo,
    is_active: isActive,
  };

  if (couponId) {
    // Update existing coupon
    const { error } = await db(adminClient)
      .from('coupons')
      .update(couponData)
      .eq('id', couponId);

    if (error) return { data: null, error: t('updateCouponError') };

    await logAudit(auth.adminId, 'update_coupon', 'coupon', couponId, { code });
    revalidatePath('/admin/settings');
    return { data: { id: couponId }, error: null };
  }

  // Create new coupon
  const { data: coupon, error } = await db(adminClient)
    .from('coupons')
    .insert(couponData)
    .select('id')
    .single();

  if (error || !coupon) return { data: null, error: t('createCouponError') };

  await logAudit(auth.adminId, 'create_coupon', 'coupon', coupon.id, { code });
  revalidatePath('/admin/settings');

  return { data: { id: coupon.id }, error: null };
}

// ---------------------------------------------------------------------------
// TOGGLE COUPON ACTIVE STATUS
// ---------------------------------------------------------------------------
export async function toggleCouponStatus(
  couponId: string,
  isActive: boolean,
): Promise<ActionResult<{ toggled: boolean }>> {
  const t = await getTranslations('actions.adminSettings');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  const { error } = await db(adminClient)
    .from('coupons')
    .update({ is_active: isActive })
    .eq('id', couponId);

  if (error) return { data: null, error: t('toggleCouponError') };

  await logAudit(auth.adminId, isActive ? 'activate_coupon' : 'deactivate_coupon', 'coupon', couponId);
  revalidatePath('/admin/settings');

  return { data: { toggled: true }, error: null };
}
