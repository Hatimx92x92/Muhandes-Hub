// =============================================================================
// Muhandes HUB — Admin Settings & Coupon Actions
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

// ---------------------------------------------------------------------------
// SAVE PLATFORM ANNOUNCEMENT
// ---------------------------------------------------------------------------
export async function savePlatformAnnouncement(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const t = await getTranslations('actions.adminSettings');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const messageAr = formData.get('message_ar') as string;
  const messageEn = formData.get('message_en') as string;
  const isActive = formData.get('is_active') === 'true';

  if (!messageAr && !messageEn) return { data: null, error: t('allFieldsRequired') };

  const adminClient = createAdminClient();

  await db(adminClient)
    .from('platform_settings')
    .upsert({
      key: 'announcement',
      value: { message_ar: messageAr, message_en: messageEn, is_active: isActive },
      updated_by: auth.adminId,
      updated_at: new Date().toISOString(),
    });

  await logAudit(auth.adminId, 'update_announcement', 'platform_settings', 'announcement', {
    message_ar: messageAr,
    is_active: isActive,
  });

  revalidatePath('/admin/settings');
  return { data: undefined, error: null };
}

// ---------------------------------------------------------------------------
// GET PLATFORM ANNOUNCEMENT (public — no admin check needed)
// ---------------------------------------------------------------------------
export async function getPlatformAnnouncement(): Promise<{
  message_ar: string;
  message_en: string;
  is_active: boolean;
} | null> {
  const adminClient = createAdminClient();

  const { data } = await db(adminClient)
    .from('platform_settings')
    .select('value')
    .eq('key', 'announcement')
    .single();

  if (!data?.value) return null;
  const val = data.value as { message_ar?: string; message_en?: string; is_active?: boolean };
  if (!val.is_active) return null;
  return {
    message_ar: val.message_ar ?? '',
    message_en: val.message_en ?? '',
    is_active: true,
  };
}

// ---------------------------------------------------------------------------
// TRIGGER TYPESENSE REINDEX
// ---------------------------------------------------------------------------
export async function triggerTypesenseReindex(): Promise<ActionResult<{ synced: number }>> {
  const t = await getTranslations('actions.adminSettings');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const { getTypesenseClient } = await import('@/lib/typesense/client');
  const typesense = getTypesenseClient();
  if (!typesense) return { data: null, error: t('typesenseNotConfigured') };

  const adminClient = createAdminClient();
  let synced = 0;

  try {
    // Sync projects
    const { data: projects } = await db(adminClient)
      .from('projects')
      .select('id, title_ar, title_en, description_ar, description_en, city_id, budget_min, budget_max, status, bid_count, deadline, created_at, source, classification, saudi_cities!inner(name_ar, name_en), profiles!projects_owner_id_fkey(full_name, company_name_ar)')
      .eq('status', 'published');
    if (projects?.length) {
      const docs = projects.map((r: Record<string, unknown>) => ({
        id: String(r.id),
        title_ar: String(r.title_ar || ''),
        title_en: String(r.title_en || ''),
        description_ar: String(r.description_ar || ''),
        description_en: String(r.description_en || ''),
        city: String((r.saudi_cities as Record<string, string> | null)?.name_en || r.city_id || ''),
        category: String(r.classification || ''),
        classification: String(r.classification || ''),
        budget_min: Number(r.budget_min || 0),
        budget_max: Number(r.budget_max || 0),
        status: String(r.status || ''),
        owner_name: String((r.profiles as Record<string, string> | null)?.full_name || ''),
        company_name: String((r.profiles as Record<string, string> | null)?.company_name_ar || ''),
        bid_count: Number(r.bid_count || 0),
        deadline: r.deadline ? new Date(String(r.deadline)).getTime() : 0,
        created_at: r.created_at ? new Date(String(r.created_at)).getTime() : Date.now(),
        source: String(r.source || ''),
      }));
      await typesense.collections('projects').documents().import(docs, { action: 'upsert' });
      synced += docs.length;
    }

    // Sync partners
    const { data: partners } = await db(adminClient)
      .from('profiles')
      .select('id, full_name, company_name_ar, company_name_en, role, bio_ar, bio_en, average_rating, total_reviews, total_deals, verification_status, city_id, saudi_cities!left(name_ar, name_en), classification')
      .in('role', ['contractor', 'supplier'])
      .eq('verification_status', 'active');
    if (partners?.length) {
      const docs = partners.map((r: Record<string, unknown>) => ({
        id: String(r.id),
        full_name: String(r.full_name || ''),
        company_name_ar: String(r.company_name_ar || ''),
        company_name_en: String(r.company_name_en || ''),
        role: String(r.role || ''),
        city: String((r.saudi_cities as Record<string, string> | null)?.name_en || ''),
        bio_ar: String(r.bio_ar || ''),
        bio_en: String(r.bio_en || ''),
        classification: String(r.classification || ''),
        rating: Number(r.average_rating || 0),
        total_reviews: Number(r.total_reviews || 0),
        total_deals: Number(r.total_deals || 0),
        created_at: Date.now(),
      }));
      await typesense.collections('partners').documents().import(docs, { action: 'upsert' });
      synced += docs.length;
    }
  } catch (err) {
    console.error('Typesense reindex error:', err);
    return { data: null, error: t('reindexError') };
  }

  await logAudit(auth.adminId, 'update_setting', 'platform_settings', 'typesense_reindex', { synced });
  return { data: { synced }, error: null };
}
