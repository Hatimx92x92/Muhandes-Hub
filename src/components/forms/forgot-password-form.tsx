'use client';

import { useActionState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { resetPassword } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertBanner } from '@/components/ui/alert-banner';
import type { ActionResult } from '@/types';

// =============================================================================
// Forgot Password Form — client component with useActionState
// =============================================================================

export function ForgotPasswordForm() {
  const t = useTranslations('auth.forgotPassword');
  const [state, formAction, pending] = useActionState<ActionResult<{ sent: boolean }> | null, FormData>(
    resetPassword,
    null,
  );

  // Show success message after email sent
  if (state?.data?.sent) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 text-sm text-primary text-center">
          <p className="font-medium mb-1">{t('success')}</p>
          <p>{t('successMsg')}</p>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary font-medium hover:underline">
            {t('returnToLogin')}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {state?.error && (
        <AlertBanner variant="error">{state.error}</AlertBanner>
      )}

      <form action={formAction} className="space-y-4">
        <Input
          label={t('email')}
          name="email"
          type="email"
          dir="ltr"
          required
          placeholder="email@example.com"
        />

        <Button type="submit" className="w-full" loading={pending}>
          {t('submit')}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t('remembered')}{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          {t('backToLogin')}
        </Link>
      </p>
    </div>
  );
}
