'use server';

import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { UpdateProfileSchema } from '@/schemas/profile';
import type { ActionResult } from '@/types';

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

  // 3. Update profile in DB
  const db = supabase as unknown as {
    from: (t: string) => {
      update: (d: Record<string, unknown>) => {
        eq: (f: string, v: string) => Promise<{ error: { message: string } | null }>;
      };
    };
  };

  const { error: dbError } = await db
    .from('profiles')
    .update({
      full_name: result.data.full_name,
      phone: result.data.phone ? `+966${result.data.phone}` : null,
      profile_type: result.data.profile_type,
      company_name_ar: result.data.company_name_ar || null,
      company_name_en: result.data.company_name_en || null,
      city: result.data.city || null,
      cr_number: result.data.cr_number || null,
      website: result.data.website || null,
      bio_ar: result.data.bio_ar || null,
      bio_en: result.data.bio_en || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (dbError) {
    return { data: null, error: t('updateError') };
  }

  return { data: { updated: true }, error: null };
}
