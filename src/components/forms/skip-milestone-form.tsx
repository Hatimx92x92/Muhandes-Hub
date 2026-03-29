// =============================================================================
// Skip to Finish Form — Request to skip remaining milestones (mutual agreement)
// =============================================================================

'use client';

import { useActionState } from 'react';
import { requestSkipToFinish } from '@/actions/deals';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/forms/form-field';
import { useTranslations } from 'next-intl';

interface SkipToFinishFormProps {
  dealId: string;
  onCancel?: () => void;
}

export function SkipToFinishForm({ dealId, onCancel }: SkipToFinishFormProps) {
  const t = useTranslations('forms.skipToFinish');
  const [state, formAction, isPending] = useActionState(requestSkipToFinish, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="deal_id" value={dealId} />

      {state?.error && !state.fieldErrors && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {state?.data && (
        <div className="rounded-lg bg-success/10 p-3 text-sm text-success">
          {t('requestSent')}
        </div>
      )}

      <FormField
        label={t('reasonLabel')}
        error={state?.error ? state.fieldErrors?.reason?.[0] : undefined}
      >
        <Textarea
          name="reason"
          placeholder={t('reasonPlaceholder')}
          rows={2}
          required
          minLength={5}
        />
      </FormField>

      <div className="flex items-center gap-2">
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          {isPending ? t('submitting') : t('submitRequest')}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            {t('cancel')}
          </Button>
        )}
      </div>
    </form>
  );
}
