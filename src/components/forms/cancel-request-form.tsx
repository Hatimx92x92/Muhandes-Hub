// =============================================================================
// Cancel Request Form Component — Request deal cancellation
// =============================================================================

'use client';

import { useActionState } from 'react';
import { requestCancellation } from '@/actions/deals';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/forms/form-field';
import { useTranslations } from 'next-intl';

interface CancelRequestFormProps {
  dealId: string;
}

export function CancelRequestForm({ dealId }: CancelRequestFormProps) {
  const t = useTranslations('forms.cancelRequest');
  const [state, formAction, isPending] = useActionState(requestCancellation, null);

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
          {state.data.autoApproved
            ? t('autoApproved')
            : t('requestSent')}
        </div>
      )}

      <FormField
        label={t('reasonLabel')}
        error={state?.error ? state.fieldErrors?.reason?.[0] : undefined}
      >
        <Textarea
          name="reason"
          placeholder={t('reasonPlaceholder')}
          rows={3}
          required
          minLength={10}
        />
      </FormField>

      <Button type="submit" variant="destructive" disabled={isPending}>
        {isPending ? t('submitting') : t('submitRequest')}
      </Button>
    </form>
  );
}
