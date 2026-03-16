// =============================================================================
// Contract Sign Form — Client Component
// =============================================================================

'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms/form-field';
import { signContract } from '@/actions/contracts';
import type { ActionResult } from '@/types';

type State = ActionResult<{ signed: boolean; fullyExecuted: boolean }> | null;

export function ContractSignForm({ contractId }: { contractId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [state, formAction, isPending] = useActionState<State, FormData>(signContract, null);
  const t = useTranslations('features.contractSign');

  if (!showForm) {
    return (
      <Button variant="primary" onClick={() => setShowForm(true)}>
        {t('signButton')}
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-4 mt-4 rounded-lg border border-border p-4">
      <input type="hidden" name="contract_id" value={contractId} />

      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <FormField
        label={t('signatoryName')}
        error={state?.error ? state.fieldErrors?.signatory_name?.[0] : undefined}
        required
      >
        <Input name="signatory_name" placeholder={t('fullNamePlaceholder')} />
      </FormField>

      <FormField
        label={t('signatoryTitle')}
        error={state?.error ? state.fieldErrors?.signatory_title?.[0] : undefined}
        required
      >
        <Input name="signatory_title" placeholder={t('titlePlaceholder')} />
      </FormField>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
          {t('cancel')}
        </Button>
        <Button type="submit" variant="primary" loading={isPending}>
          {t('confirmSign')}
        </Button>
      </div>
    </form>
  );
}
