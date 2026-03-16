'use server';

import { getTranslations } from 'next-intl/server';
import { ContactFormSchema } from '@/schemas/contact';
import type { ActionResult } from '@/types';

// =============================================================================
// submitContactForm — public contact form submission
// =============================================================================

export async function submitContactForm(
  _prevState: ActionResult<{ sent: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ sent: boolean }>> {
  const t = await getTranslations('actions.contact');
  // 1. Validate
  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    subject: formData.get('subject') as string,
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
