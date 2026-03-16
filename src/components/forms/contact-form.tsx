'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { submitContactForm } from '@/actions/contact';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

// =============================================================================
// Contact Form — public contact page form
// =============================================================================

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactForm, null);
  const t = useTranslations('forms.contact');

  if (state?.data?.sent) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Send className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{t('successTitle')}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('successMsg')}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="name"
          label={t('name')}
          placeholder={t('namePlaceholder')}
          required
          error={state?.error ? state.fieldErrors?.name?.[0] : undefined}
        />
        <Input
          name="email"
          label={t('email')}
          type="email"
          placeholder="example@email.com"
          dir="ltr"
          required
          error={state?.error ? state.fieldErrors?.email?.[0] : undefined}
        />
      </div>

      <Input
        name="subject"
        label={t('subject')}
        placeholder={t('subjectPlaceholder')}
        required
        error={state?.error ? state.fieldErrors?.subject?.[0] : undefined}
      />

      <Textarea
        name="message"
        label={t('message')}
        placeholder={t('messagePlaceholder')}
        rows={5}
        required
        error={state?.error ? state.fieldErrors?.message?.[0] : undefined}
      />

      <Button type="submit" loading={isPending} className="w-full sm:w-auto">
        <Send className="h-4 w-4 me-2" />
        {t('submit')}
      </Button>
    </form>
  );
}
