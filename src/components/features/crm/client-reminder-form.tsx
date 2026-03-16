// =============================================================================
// Client Reminder Form — Client Component
// =============================================================================

'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setReminder } from '@/actions/crm';
import type { ActionResult } from '@/types';

type State = ActionResult<{ id: string }> | null;

export function ClientReminderForm({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<State, FormData>(setReminder, null);
  const t = useTranslations('features.clientReminder');

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="w-full">
        {t('addReminder')}
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border p-3">
      <input type="hidden" name="client_id" value={clientId} />

      {state?.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}

      <Input name="reminder_date" type="date" />
      <Input name="note" placeholder={t('notePlaceholder')} />

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          {t('cancel')}
        </Button>
        <Button type="submit" variant="primary" size="sm" loading={isPending}>
          {t('save')}
        </Button>
      </div>
    </form>
  );
}
