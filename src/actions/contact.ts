'use server';

import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { ContactFormSchema } from '@/schemas/contact';
import { contactLimiter, checkRateLimit } from '@/lib/rate-limit';
import type { ActionResult } from '@/types';

// =============================================================================
// submitContactForm — public contact form submission
// =============================================================================

export async function submitContactForm(
  _prevState: ActionResult<{ sent: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ sent: boolean }>> {
  const t = await getTranslations('actions.contact');

  // 0. Rate limit by IP
  const headerStore = await headers();
  const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = contactLimiter();
  const { success: rlOk } = await checkRateLimit(rl, ip);
  if (!rlOk) return { data: null, error: t('tooManyRequests') };

  // 1. Validate
  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    subject: formData.get('subject') as string,
    company: formData.get('company') as string || undefined,
    role_interest: formData.get('role_interest') as string || undefined,
    message: formData.get('message') as string,
  };

  const result = ContactFormSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { data: null, error: t('validationError'), fieldErrors };
  }

  // 2. Store in DB (when Supabase is connected) or send email via Resend
  // For now, we log and return success. In production:
  // - Insert into `contact_messages` table
  // - Send notification email via Resend to admin
  // - Rate limit by IP

  // TODO: Integrate with Supabase + Resend when accounts are configured

  return { data: { sent: true }, error: null };
}
