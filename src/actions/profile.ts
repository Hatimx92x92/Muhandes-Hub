'use server';

import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { UpdateProfileSchema, CompanyDocumentSchema } from '@/schemas/profile';
import type { ActionResult } from '@/types';
import { generateUniqueSlug } from '@/lib/utils';
import { autoTranslateBilingualFields } from '@/lib/translate';
import { uploadFile } from '@/actions/uploads';
import { apiLimiter, checkRateLimit } from '@/lib/rate-limit';

// =============================================================================
// updateProfile — update authenticated user's profile
// =============================================================================

export async function updateProfile(
  _prevState: ActionResult<{ updated: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ updated: boolean }>> {
  const t = await getTranslations('actions.profile');
  // 1. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: t('mustLogin') };
  }

  // 2. Validate
  const raw = {
    full_name: formData.get('full_name') as string,
    phone: formData.get('phone') as string || undefined,
    profile_type: formData.get('profile_type') as string,
    company_name_ar: formData.get('company_name_ar') as string || undefined,
    company_name_en: formData.get('company_name_en') as string || undefined,
    city: formData.get('city') as string || undefined,
    cr_number: formData.get('cr_number') as string || undefined,
    website: formData.get('website') as string || undefined,
    bio_ar: formData.get('bio_ar') as string || undefined,
    bio_en: formData.get('bio_en') as string || undefined,
    // New fields
    visibility: (() => {
      const v = formData.get('visibility') as string | null;
      if (v) try { return JSON.parse(v); } catch { return undefined; }
      return undefined;
    })(),
    social_links: (() => {
      const s = formData.get('social_links') as string | null;
      if (s) try { return JSON.parse(s); } catch { return undefined; }
      return undefined;
    })(),
    specializations: (() => {
      const s = formData.get('specializations') as string | null;
      if (s) try { return JSON.parse(s); } catch { return undefined; }
      return undefined;
    })(),
    established_year: (() => {
      const y = formData.get('established_year') as string | null;
      if (y && y.trim()) return parseInt(y, 10);
      return null;
    })(),
  };

  const result = UpdateProfileSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { data: null, error: t('validationErrors'), fieldErrors };
  }

  // Auto-translate missing bilingual fields
  const translated = await autoTranslateBilingualFields(result.data as Record<string, unknown>, ['company_name', 'bio']);

  // Generate slugs from company name or full name
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny = supabase as any;
  const slugSourceAr = (translated.company_name_ar as string) || result.data.company_name_ar || result.data.full_name;
  const slugSourceEn = (translated.company_name_en as string) || result.data.company_name_en || result.data.full_name;
  const [slug_ar, slug_en] = await Promise.all([
    generateUniqueSlug(slugSourceAr, 'profiles', 'slug_ar', dbAny, user.id),
    generateUniqueSlug(slugSourceEn, 'profiles', 'slug_en', dbAny, user.id),
  ]);

  // 3. Update profile in DB
  const db = supabase as unknown as {
    from: (t: string) => {
      update: (d: Record<string, unknown>) => {
        eq: (f: string, v: string) => Promise<{ error: { message: string } | null }>;
      };
      select: (c: string) => {
        ilike: (f: string, v: string) => {
          single: () => Promise<{ data: { id: string } | null }>;
        };
      };
    };
  };

  // Resolve city slug → UUID from saudi_cities table
  let cityId: string | null = null;
  if (result.data.city) {
    const cityName = result.data.city;
    // Check if it's already a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(cityName)) {
      cityId = cityName;
    } else {
      // Look up by name_en (case-insensitive)
      const { data: cityData } = await db
        .from('saudi_cities')
        .select('id')
        .ilike('name_en', cityName)
        .single();
      cityId = cityData?.id ?? null;
    }
  }

  const { error: dbError } = await db
    .from('profiles')
    .update({
      full_name: result.data.full_name,
      phone: result.data.phone ? `+966${result.data.phone}` : null,
      profile_type: result.data.profile_type,
      company_name_ar: (translated.company_name_ar as string) || result.data.company_name_ar || null,
      company_name_en: (translated.company_name_en as string) || result.data.company_name_en || null,
      ...(cityId !== null ? { city_id: cityId } : {}),
      cr_number: result.data.cr_number || null,
      website: result.data.website || null,
      bio_ar: (translated.bio_ar as string) || result.data.bio_ar || null,
      bio_en: (translated.bio_en as string) || result.data.bio_en || null,
      slug_ar,
      slug_en,
      // New fields
      ...(result.data.visibility ? { profile_visibility: result.data.visibility } : {}),
      ...(result.data.social_links ? { social_links: result.data.social_links } : {}),
      ...(result.data.specializations ? { specializations: result.data.specializations } : {}),
      ...(result.data.established_year !== undefined ? { established_year: result.data.established_year } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (dbError) {
    console.error('[updateProfile] DB error:', dbError);
    return { data: null, error: t('updateError') };
  }

  return { data: { updated: true }, error: null };
}

// =============================================================================
// uploadCompanyDocument — upload a PDF with custom display name (max 3)
// =============================================================================

export async function uploadCompanyDocument(
  formData: FormData,
): Promise<ActionResult<{ id: string; url: string }>> {
  const t = await getTranslations('actions.profile');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Rate limit
  const rl = apiLimiter();
  const { success: rlOk } = await checkRateLimit(rl, user.id);
  if (!rlOk) return { data: null, error: t('tooManyRequests') };

  // Validate display_name
  const displayName = formData.get('display_name') as string;
  const nameResult = CompanyDocumentSchema.safeParse({ display_name: displayName });
  if (!nameResult.success) {
    return { data: null, error: nameResult.error.issues[0]?.message || t('validationErrors') };
  }

  // Check max 3 documents
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny = supabase as any;
  const { data: existing, error: countErr } = await dbAny
    .from('company_documents')
    .select('id')
    .eq('user_id', user.id);

  if (countErr) return { data: null, error: t('updateError') };
  if (existing && existing.length >= 3) {
    return { data: null, error: t('maxDocumentsReached') };
  }

  // Get file
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { data: null, error: t('noFileSelected') };

  // Upload to storage
  const uploadResult = await uploadFile('company-documents', file, `doc-${Date.now()}`);
  if (uploadResult.error) return { data: null, error: uploadResult.error };

  // Insert DB record
  const { data: doc, error: insertErr } = await dbAny
    .from('company_documents')
    .insert({
      user_id: user.id,
      display_name: nameResult.data.display_name,
      file_url: uploadResult.data!.url,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      sort_order: existing?.length || 0,
    })
    .select('id')
    .single();

  if (insertErr) {
    console.error('[uploadCompanyDocument] DB error:', insertErr);
    return { data: null, error: t('updateError') };
  }

  return { data: { id: doc.id, url: uploadResult.data!.url }, error: null };
}

// =============================================================================
// deleteCompanyDocument — delete a document owned by the user
// =============================================================================

export async function deleteCompanyDocument(
  documentId: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  const t = await getTranslations('actions.profile');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny = supabase as any;

  // Verify ownership
  const { data: doc } = await dbAny
    .from('company_documents')
    .select('id, file_url, user_id')
    .eq('id', documentId)
    .single();

  if (!doc || doc.user_id !== user.id) {
    return { data: null, error: t('notFound') };
  }

  // Delete from storage - extract path from URL
  try {
    const url = new URL(doc.file_url);
    const pathParts = url.pathname.split('/storage/v1/object/public/company-documents/');
    if (pathParts[1]) {
      await supabase.storage.from('company-documents').remove([pathParts[1]]);
    }
  } catch {
    // Continue even if storage delete fails
  }

  // Delete DB record
  const { error: delErr } = await dbAny
    .from('company_documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', user.id);

  if (delErr) {
    console.error('[deleteCompanyDocument] DB error:', delErr);
    return { data: null, error: t('updateError') };
  }

  return { data: { deleted: true }, error: null };
}

// =============================================================================
// updateCompanyDocumentName — rename a document
// =============================================================================

export async function updateCompanyDocumentName(
  documentId: string,
  newName: string,
): Promise<ActionResult<{ updated: boolean }>> {
  const t = await getTranslations('actions.profile');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const nameResult = CompanyDocumentSchema.safeParse({ display_name: newName });
  if (!nameResult.success) {
    return { data: null, error: nameResult.error.issues[0]?.message || t('validationErrors') };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny = supabase as any;

  const { error: updateErr } = await dbAny
    .from('company_documents')
    .update({ display_name: nameResult.data.display_name })
    .eq('id', documentId)
    .eq('user_id', user.id);

  if (updateErr) {
    console.error('[updateCompanyDocumentName] DB error:', updateErr);
    return { data: null, error: t('updateError') };
  }

  return { data: { updated: true }, error: null };
}
