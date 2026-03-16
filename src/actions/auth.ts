// =============================================================================
// Muqawil HUB — Auth Server Actions
// =============================================================================

'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';

import { createClient } from '@/lib/supabase/server';
import { LoginSchema, RegisterSchema, ResetPasswordSchema, UpdatePasswordSchema } from '@/schemas/auth';
import { loginLimiter, registrationLimiter, checkRateLimit } from '@/lib/rate-limit';
import type { ActionResult } from '@/types';

// Temporary helper: until DB types are generated, cast supabase for table queries
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: Awaited<ReturnType<typeof createClient>>): any {
  return supabase;
}

// ---------------------------------------------------------------------------
// Helper: extract IP for rate-limit context (future Upstash integration)
// ---------------------------------------------------------------------------
async function getClientIP(): Promise<string> {
  const hdrs = await headers();
  return hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
}

// ---------------------------------------------------------------------------
// LOGIN — email + password
// ---------------------------------------------------------------------------
export async function login(
  _prevState: ActionResult<{ redirectTo: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ redirectTo: string }>> {
  const t = await getTranslations('actions.auth');

  // 1. Rate limit check (5 per 15min per email)
  const emailKey = String(formData.get('email') || 'unknown').toLowerCase();
  const rl = await checkRateLimit(loginLimiter(), `login:${emailKey}`);
  if (!rl.success) {
    return { data: null, error: t('tooManyLoginAttempts') };
  }

  // 2. Parse & validate
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  };
  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      fieldErrors[key] = fieldErrors[key] ?? [];
      fieldErrors[key].push(issue.message);
    }
    return { data: null, error: t('invalidData'), fieldErrors };
  }

  // 3. Sign in with Supabase
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { data: null, error: t('invalidCredentials') };
  }

  // 4. Check profile status (once DB types are generated, remove db() wrapper)
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await db(supabase)
      .from('profiles')
      .select('verification_status, role, tier')
      .eq('id', user.id)
      .single();

    if (profile?.verification_status === 'banned') {
      await supabase.auth.signOut();
      return { data: null, error: t('accountBanned') };
    }

    if (profile?.verification_status === 'restricted') {
      await supabase.auth.signOut();
      return { data: null, error: t('accountRestricted') };
    }

    // Route verification-pending users to appropriate gate
    const status = profile?.verification_status;
    if (status === 'pending_email') {
      revalidatePath('/', 'layout');
      return { data: { redirectTo: '/verify/email-sent' }, error: null };
    }
    if (status === 'pending_payment') {
      revalidatePath('/', 'layout');
      return { data: { redirectTo: '/verify/payment' }, error: null };
    }
    if (status === 'pending_documents') {
      revalidatePath('/', 'layout');
      return { data: { redirectTo: '/verify/documents' }, error: null };
    }
    if (status === 'pending_approval') {
      revalidatePath('/', 'layout');
      return { data: { redirectTo: '/verify/pending-approval' }, error: null };
    }
  }

  revalidatePath('/', 'layout');
  return { data: { redirectTo: '/dashboard' }, error: null };
}

// ---------------------------------------------------------------------------
// REGISTER — multi-step wizard submission
// ---------------------------------------------------------------------------
export async function register(
  _prevState: ActionResult<{ userId: string; requiresPayment: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ userId: string; requiresPayment: boolean }>> {
  const t = await getTranslations('actions.auth');

  // 1. Rate limit check (3 per hour per IP)
  const ip = await getClientIP();
  const rl = await checkRateLimit(registrationLimiter(), `register:${ip}`);
  if (!rl.success) {
    return { data: null, error: t('tooManyRegistrations') };
  }

  // 2. Parse & validate
  const raw = {
    role: formData.get('role'),
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
    phone: formData.get('phone'),
    pdpl_consent: formData.get('pdpl_consent') === 'true',
    profile_type: formData.get('profile_type'),
    company_name_ar: formData.get('company_name_ar') || undefined,
    company_name_en: formData.get('company_name_en') || undefined,
    cr_number: formData.get('cr_number') || undefined,
    website: formData.get('website') || undefined,
    city: formData.get('city'),
    tier: formData.get('tier') || undefined,
    duration_months: formData.get('duration_months')
      ? Number(formData.get('duration_months'))
      : undefined,
    coupon_code: formData.get('coupon_code') || undefined,
  };

  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      fieldErrors[key] = fieldErrors[key] ?? [];
      fieldErrors[key].push(issue.message);
    }
    return { data: null, error: t('invalidData'), fieldErrors };
  }

  const { email, password, full_name, phone, role, profile_type, city } = parsed.data;
  const tier = parsed.data.tier || 'starter';

  // 3. Sign up with Supabase Auth
  const supabase = await createClient();
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        phone: `+966${phone}`,
        role,
        profile_type,
        city,
        company_name_ar: parsed.data.company_name_ar,
        company_name_en: parsed.data.company_name_en,
        cr_number: parsed.data.cr_number,
        website: parsed.data.website,
        tier,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  });

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      return { data: null, error: t('emailAlreadyRegistered') };
    }
    return { data: null, error: signUpError.message };
  }

  if (!authData.user) {
    return { data: null, error: t('accountCreationError') };
  }

  // 4. DB trigger `handle_new_user()` creates the profile row automatically.
  //    For paid tiers, the user needs to complete payment next.
  const requiresPayment =
    (role === 'contractor' || role === 'supplier') && tier !== 'starter';

  return {
    data: { userId: authData.user.id, requiresPayment },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// LOGIN WITH GOOGLE — OAuth PKCE flow
// ---------------------------------------------------------------------------
export async function loginWithGoogle(): Promise<ActionResult<{ url: string }>> {
  const t = await getTranslations('actions.auth');
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    return { data: null, error: t('googleAuthError') };
  }

  return { data: { url: data.url }, error: null };
}

// ---------------------------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------------------------
export async function logout(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

// ---------------------------------------------------------------------------
// RESET PASSWORD — send reset email
// ---------------------------------------------------------------------------
export async function resetPassword(
  _prevState: ActionResult<{ sent: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ sent: boolean }>> {
  const t = await getTranslations('actions.auth');

  const raw = { email: formData.get('email') };
  const parsed = ResetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: t('invalidEmail') };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/dashboard/settings/password`,
  });

  if (error) {
    return { data: null, error: t('resetLinkError') };
  }

  return { data: { sent: true }, error: null };
}

// ---------------------------------------------------------------------------
// UPDATE PASSWORD — after reset link clicked
// ---------------------------------------------------------------------------
export async function updatePassword(
  _prevState: ActionResult<{ updated: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ updated: boolean }>> {
  const t = await getTranslations('actions.auth');

  const raw = {
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  };
  const parsed = UpdatePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      fieldErrors[key] = fieldErrors[key] ?? [];
      fieldErrors[key].push(issue.message);
    }
    return { data: null, error: t('invalidData'), fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { data: null, error: t('passwordUpdateError') };
  }

  return { data: { updated: true }, error: null };
}

// ---------------------------------------------------------------------------
// UPLOAD VERIFICATION DOCUMENTS — Gate 3: pending_documents → pending_approval
// ---------------------------------------------------------------------------
export async function uploadVerificationDocuments(
  _prevState: ActionResult<{ submitted: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ submitted: boolean }>> {
  const t = await getTranslations('actions.auth');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('loginRequired') };

  // Verify user is in the correct gate
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('verification_status')
    .eq('id', user.id)
    .single();

  if (profile?.verification_status !== 'pending_documents') {
    return { data: null, error: t('stepNotAvailable') };
  }

  const vatCert = formData.get('vat_certificate') as File | null;
  const crLicense = formData.get('cr_license') as File | null;

  if (!vatCert || !crLicense) {
    return { data: null, error: t('vatAndCrRequired') };
  }

  // Validate file sizes (10 MB max each)
  const maxSize = 10 * 1024 * 1024;
  if (vatCert.size > maxSize || crLicense.size > maxSize) {
    return { data: null, error: t('fileTooLarge') };
  }

  // Validate MIME types
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(vatCert.type) || !allowedTypes.includes(crLicense.type)) {
    return { data: null, error: t('unsupportedFileType') };
  }

  // Upload to Supabase Storage
  const vatPath = `verification/${user.id}/vat-certificate${getExtension(vatCert.name)}`;
  const crPath = `verification/${user.id}/cr-license${getExtension(crLicense.name)}`;

  const [vatUpload, crUpload] = await Promise.all([
    supabase.storage.from('documents').upload(vatPath, vatCert, { upsert: true }),
    supabase.storage.from('documents').upload(crPath, crLicense, { upsert: true }),
  ]);

  if (vatUpload.error || crUpload.error) {
    return { data: null, error: t('documentUploadError') };
  }

  // Update profile with document paths and advance to pending_approval
  const { error: updateError } = await db(supabase)
    .from('profiles')
    .update({
      vat_certificate_url: vatPath,
      cr_license_url: crPath,
      verification_status: 'pending_approval',
      documents_submitted_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    return { data: null, error: t('statusUpdateError') };
  }

  return { data: { submitted: true }, error: null };
}

// ---------------------------------------------------------------------------
// RESEND VERIFICATION EMAIL — for users stuck on pending_email
// ---------------------------------------------------------------------------
export async function resendVerificationEmail(): Promise<ActionResult<{ sent: boolean }>> {
  const t = await getTranslations('actions.auth');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { data: null, error: t('loginRequired') };

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: user.email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  });

  if (error) {
    return { data: null, error: t('resendVerificationError') };
  }

  return { data: { sent: true }, error: null };
}

// ---------------------------------------------------------------------------
// Helper: file extension from name
// ---------------------------------------------------------------------------
function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.substring(idx) : '';
}
