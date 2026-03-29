// =============================================================================
// Muhandes HUB — Auth Server Actions
// =============================================================================

'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers, cookies } from 'next/headers';
import { getTranslations, getLocale } from 'next-intl/server';
import crypto from 'crypto';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { LoginSchema, RegisterSchema, GoogleRegisterSchema, ResetPasswordSchema, UpdatePasswordSchema } from '@/schemas/auth';
import { loginLimiter, registrationLimiter, passwordResetLimiter, checkRateLimit } from '@/lib/rate-limit';
import { localizeFieldErrors } from '@/lib/zod-i18n';
import { generateUniqueSlug } from '@/lib/utils';
import type { ActionResult } from '@/types';

// Temporary helper: until DB types are generated, cast supabase for table queries
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: Awaited<ReturnType<typeof createClient>>): any {
  return supabase;
}

/** Convert Zod issues to localized field errors */
async function zodFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const locale = await getLocale();
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? 'form');
    fieldErrors[key] = fieldErrors[key] ?? [];
    fieldErrors[key].push(issue.message);
  }
  return localizeFieldErrors(fieldErrors, locale);
}

// ---------------------------------------------------------------------------
// Helper: extract IP for rate-limit context (future Upstash integration)
// ---------------------------------------------------------------------------
async function getClientIP(): Promise<string> {
  const hdrs = await headers();
  return hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
}

// ---------------------------------------------------------------------------
// Helper: set single-device session token (invalidates all other devices)
// ---------------------------------------------------------------------------
async function setSessionToken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const token = crypto.randomUUID();
  await db(supabase)
    .from('profiles')
    .update({ active_session_token: token })
    .eq('id', userId);

  const cookieStore = await cookies();
  cookieStore.set('mh_session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year (invalidated by new login)
  });
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
    return { data: null, error: t('invalidData'), fieldErrors: await zodFieldErrors(parsed.error.issues) };
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
      .select('verification_status, role, is_admin')
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

    // 5. Single-device enforcement — set session token (invalidates other devices)
    await setSessionToken(supabase, user.id);

    // Route verification-pending users to appropriate gate
    const status = profile?.verification_status;
    if (status === 'pending_email') {
      // Safety net: if Supabase already confirmed the email (e.g. callback failed
      // due to PKCE cookie loss / different browser), auto-advance the status
      if (user.email_confirmed_at) {
        const role = profile.role as string;
        const { data: sub } = await db(supabase)
          .from('subscriptions')
          .select('tier')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();
        const tier = (sub?.tier as string) || 'starter';
        const isPro = (role === 'contractor' || role === 'supplier') && tier !== 'starter';
        const nextStatus = isPro ? 'pending_payment' : 'active';

        await db(supabase)
          .from('profiles')
          .update({ verification_status: nextStatus })
          .eq('id', user.id);

        revalidatePath('/', 'layout');
        if (isPro) {
          return { data: { redirectTo: '/verify/payment' }, error: null };
        }
        return { data: { redirectTo: '/dashboard' }, error: null };
      }

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

    // Admin users go to admin panel
    if (profile?.is_admin) {
      revalidatePath('/', 'layout');
      return { data: { redirectTo: '/admin' }, error: null };
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
    payment_method: formData.get('payment_method') || undefined,
  };

  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: await zodFieldErrors(parsed.error.issues) };
  }

  const { email, password, full_name, phone, role, profile_type, city } = parsed.data;
  const tier = parsed.data.tier || 'starter';
  const paymentMethod = parsed.data.payment_method;

  // 3. Sign up with Supabase Auth
  const supabase = await createClient();
  const formattedPhone = `+966${phone}`;
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        phone: formattedPhone,
        role,
        profile_type,
        city,
        company_name_ar: parsed.data.company_name_ar,
        company_name_en: parsed.data.company_name_en,
        cr_number: parsed.data.cr_number,
        website: parsed.data.website,
        tier,
        provider: 'email',
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

  // Store phone in auth.users.phone via admin API (signUp ignores phone for email-based auth)
  const adminClient = createAdminClient();
  await adminClient.auth.admin.updateUserById(authData.user.id, {
    phone: formattedPhone,
  });

  // 4. DB trigger `handle_new_user()` creates the profile row automatically.
  //    Update with additional fields the trigger doesn't set.
  //    Use admin client because there's no session after email-requiring signUp.
  const profileUpdate: Record<string, unknown> = { profile_type };
  if (parsed.data.company_name_ar) profileUpdate.company_name_ar = parsed.data.company_name_ar;
  if (parsed.data.company_name_en) profileUpdate.company_name_en = parsed.data.company_name_en;
  if (parsed.data.cr_number) profileUpdate.cr_number = parsed.data.cr_number;
  if (parsed.data.website) profileUpdate.website = parsed.data.website;

  // Look up city_id from slug (use admin client — no user session yet)
  if (city) {
    const { data: cityRow } = await adminClient
      .from('saudi_cities')
      .select('id')
      .ilike('name_en', city)
      .single();
    if (cityRow) profileUpdate.city_id = cityRow.id;
  }

  // Generate slugs from company name or full name
  const slugSourceAr = parsed.data.company_name_ar || full_name;
  const slugSourceEn = parsed.data.company_name_en || full_name;
  const [slug_ar, slug_en] = await Promise.all([
    generateUniqueSlug(slugSourceAr, 'profiles', 'slug_ar', adminClient, authData.user.id),
    generateUniqueSlug(slugSourceEn, 'profiles', 'slug_en', adminClient, authData.user.id),
  ]);
  if (slug_ar) profileUpdate.slug_ar = slug_ar;
  if (slug_en) profileUpdate.slug_en = slug_en;

  await adminClient
    .from('profiles')
    .update(profileUpdate)
    .eq('id', authData.user.id);

  //    For paid tiers, the user needs to complete payment next.
  const requiresPayment =
    (role === 'contractor' || role === 'supplier') && tier !== 'starter';

  // 5. Handle bank transfer receipt upload for paid tiers
  if (requiresPayment && paymentMethod === 'bank_transfer') {
    const bankReceipt = formData.get('bank_receipt') as File | null;
    if (bankReceipt && bankReceipt.size > 0) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

      if (bankReceipt.size > maxSize || !allowedTypes.includes(bankReceipt.type)) {
        return { data: null, error: t('invalidReceipt') };
      }

      const ext = getExtension(bankReceipt.name);
      const receiptPath = `${authData.user.id}/receipt${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('bank-payments')
        .upload(receiptPath, bankReceipt);

      if (uploadError) {
        return { data: null, error: t('receiptUploadError') };
      }

      // Store receipt path on the profile for admin review
      await db(supabase)
        .from('profiles')
        .update({ bank_receipt_url: receiptPath })
        .eq('id', authData.user.id);
    }
  }

  // 6. Upload verification documents (Pro+ contractors/suppliers)
  const verificationDocs = formData.getAll('verification_docs') as File[];
  if (verificationDocs.length > 0) {
    const allowedDocTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxDocSize = 10 * 1024 * 1024; // 10MB

    for (const doc of verificationDocs) {
      if (doc.size === 0) continue;
      if (doc.size > maxDocSize || !allowedDocTypes.includes(doc.type)) continue;

      // Extract doc type from filename prefix (cr_, vat_, class_)
      let docType = 'other';
      if (doc.name.startsWith('cr_')) docType = 'cr_certificate';
      else if (doc.name.startsWith('vat_')) docType = 'vat_certificate';
      else if (doc.name.startsWith('class_')) docType = 'classification_certificate';

      const ext = getExtension(doc.name);
      const docPath = `${authData.user.id}/${docType}-${Date.now()}${ext}`;
      const { error: docUploadError } = await supabase.storage
        .from('verification-docs')
        .upload(docPath, doc, { contentType: doc.type });

      if (!docUploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('verification-docs')
          .getPublicUrl(docPath);

        await db(supabase)
          .from('verification_documents')
          .insert({
            user_id: authData.user.id,
            document_type: docType,
            file_url: publicUrl,
            status: 'pending',
          });
      }
    }
  }

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
  // Clear single-device session token
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await db(supabase)
      .from('profiles')
      .update({ active_session_token: null })
      .eq('id', user.id);
  }
  const cookieStore = await cookies();
  cookieStore.set('mh_session_token', '', { maxAge: 0, path: '/' });
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

// ---------------------------------------------------------------------------
// COMPLETE GOOGLE REGISTRATION — update existing profile after OAuth sign-up
// ---------------------------------------------------------------------------
export async function completeGoogleRegistration(
  _prevState: ActionResult<{ userId: string; requiresPayment: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ userId: string; requiresPayment: boolean }>> {
  const t = await getTranslations('actions.auth');

  // 1. Auth — user must be logged in via Google OAuth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('loginRequired') };

  // 2. Rate limit
  const ip = await getClientIP();
  const rl = await checkRateLimit(registrationLimiter(), `register:${ip}`);
  if (!rl.success) {
    return { data: null, error: t('tooManyRegistrations') };
  }

  // 3. Validate
  const raw = {
    role: formData.get('role'),
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
    payment_method: formData.get('payment_method') || undefined,
  };

  const parsed = GoogleRegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: await zodFieldErrors(parsed.error.issues) };
  }

  const { role, phone, profile_type, city } = parsed.data;
  const tier = parsed.data.tier || 'starter';
  const paymentMethod = parsed.data.payment_method;

  // 4. Update the profile created by the trigger
  const fullName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? '';

  // Generate slugs from company name or full name
  const gSlugSourceAr = parsed.data.company_name_ar || fullName;
  const gSlugSourceEn = parsed.data.company_name_en || fullName;
  const [gSlugAr, gSlugEn] = await Promise.all([
    generateUniqueSlug(gSlugSourceAr, 'profiles', 'slug_ar', supabase, user.id),
    generateUniqueSlug(gSlugSourceEn, 'profiles', 'slug_en', supabase, user.id),
  ]);

  const { error: updateError } = await db(supabase)
    .from('profiles')
    .update({
      role,
      phone: `+966${phone}`,
      profile_type,
      city,
      full_name: fullName,
      company_name_ar: parsed.data.company_name_ar,
      company_name_en: parsed.data.company_name_en,
      cr_number: parsed.data.cr_number,
      website: parsed.data.website,
      tier,
      provider: 'google',
      pdpl_consent: true,
      pdpl_consent_date: new Date().toISOString(),
      ...(gSlugAr ? { slug_ar: gSlugAr } : {}),
      ...(gSlugEn ? { slug_en: gSlugEn } : {}),
    })
    .eq('id', user.id);

  if (updateError) {
    return { data: null, error: t('accountCreationError') };
  }

  const requiresPayment =
    (role === 'contractor' || role === 'supplier') && tier !== 'starter';

  // 5. Handle bank transfer receipt for paid tiers
  if (requiresPayment && paymentMethod === 'bank_transfer') {
    const bankReceipt = formData.get('bank_receipt') as File | null;
    if (bankReceipt && bankReceipt.size > 0) {
      const maxSize = 5 * 1024 * 1024;
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

      if (bankReceipt.size > maxSize || !allowedTypes.includes(bankReceipt.type)) {
        return { data: null, error: t('invalidReceipt') };
      }

      const ext = getExtension(bankReceipt.name);
      const receiptPath = `${user.id}/receipt${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('bank-payments')
        .upload(receiptPath, bankReceipt);

      if (uploadError) {
        return { data: null, error: t('receiptUploadError') };
      }

      await db(supabase)
        .from('profiles')
        .update({ bank_receipt_url: receiptPath })
        .eq('id', user.id);
    }
  }

  // 6. Set verification status — Google users skip email verification
  if (requiresPayment) {
    await db(supabase)
      .from('profiles')
      .update({ verification_status: 'pending_payment' })
      .eq('id', user.id);
  } else {
    await db(supabase)
      .from('profiles')
      .update({ verification_status: 'active' })
      .eq('id', user.id);
  }

  // 7. Upload verification documents (Pro+ contractors/suppliers)
  const verificationDocs = formData.getAll('verification_docs') as File[];
  if (verificationDocs.length > 0) {
    const allowedDocTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxDocSize = 10 * 1024 * 1024;

    for (const doc of verificationDocs) {
      if (doc.size === 0) continue;
      if (doc.size > maxDocSize || !allowedDocTypes.includes(doc.type)) continue;

      let docType = 'other';
      if (doc.name.startsWith('cr_')) docType = 'cr_certificate';
      else if (doc.name.startsWith('vat_')) docType = 'vat_certificate';
      else if (doc.name.startsWith('class_')) docType = 'classification_certificate';

      const ext = getExtension(doc.name);
      const docPath = `${user.id}/${docType}-${Date.now()}${ext}`;
      const { error: docUploadError } = await supabase.storage
        .from('verification-docs')
        .upload(docPath, doc, { contentType: doc.type });

      if (!docUploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('verification-docs')
          .getPublicUrl(docPath);

        await db(supabase)
          .from('verification_documents')
          .insert({
            user_id: user.id,
            document_type: docType,
            file_url: publicUrl,
            status: 'pending',
          });
      }
    }
  }

  // Single-device enforcement — set session token
  await setSessionToken(supabase, user.id);

  revalidatePath('/', 'layout');
  return {
    data: { userId: user.id, requiresPayment },
    error: null,
  };
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

  // Rate limit: 3 per hour per email
  const rl = await checkRateLimit(passwordResetLimiter(), `pwd-reset:${parsed.data.email.toLowerCase()}`);
  if (!rl.success) {
    return { data: null, error: t('tooManyResetAttempts') };
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
    return { data: null, error: t('invalidData'), fieldErrors: await zodFieldErrors(parsed.error.issues) };
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
