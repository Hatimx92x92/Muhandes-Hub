'use server';

import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { ContactFormSchema } from '@/schemas/contact';
import { contactLimiter, checkRateLimit } from '@/lib/rate-limit';
import type { ActionResult } from '@/types';
import { sendEmail } from '@/lib/resend/client';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'muqawilhub@gmail.com';

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

  // 2. Send email notification to admin
  const { name, email, subject, company, role_interest, message } = result.data;
  const companyLine = company ? `\nCompany / الشركة: ${company}` : '';
  const roleLine = role_interest ? `\nRole Interest / الدور المطلوب: ${role_interest}` : '';

  void sendEmail({
    to: ADMIN_EMAIL,
    subject: { ar: `رسالة جديدة: ${subject}`, en: `New Contact: ${subject}` },
    heading: { ar: 'رسالة جديدة من نموذج التواصل', en: 'New Contact Form Message' },
    body: {
      ar: `الاسم: ${name}\nالبريد: ${email}${companyLine}${roleLine}\n\n${message}`,
      en: `Name: ${name}\nEmail: ${email}${companyLine}${roleLine}\n\n${message}`,
    },
  });

  return { data: { sent: true }, error: null };
}
