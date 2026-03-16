'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { updatePlatformSettings } from '@/actions/admin/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ActionResult } from '@/types';

type State = ActionResult | null;

export function SettingsForm() {
  const [state, formAction, isPending] = useActionState<State, FormData>(updatePlatformSettings, null);
  const t = useTranslations('features.adminSettings');

  return (
    <form action={formAction} className="space-y-3">
      <Input name="key" placeholder={t('keyPlaceholder')} required />
      <Textarea name="value" placeholder={t('valuePlaceholder')} rows={3} required />

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state && !state.error && (
        <p className="text-sm text-success">{t('updateSuccess')}</p>
      )}

      <Button type="submit" variant="primary" loading={isPending}>
        {t('saveSetting')}
      </Button>
    </form>
  );
}
