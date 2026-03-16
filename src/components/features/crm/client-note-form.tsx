// =============================================================================
// Client Note Form — Client Component
// =============================================================================

'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { addClientNote } from '@/actions/crm';
import type { ActionResult } from '@/types';

type State = ActionResult<{ id: string }> | null;

export function ClientNoteForm({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<State, FormData>(addClientNote, null);
  const t = useTranslations('features.clientNote');

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {t('addNote')}
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border p-3">
      <input type="hidden" name="client_id" value={clientId} />

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Textarea name="content_ar" rows={3} placeholder={t('contentArPlaceholder')} />
      <Textarea name="content_en" rows={2} placeholder={t('contentEnPlaceholder')} />

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
