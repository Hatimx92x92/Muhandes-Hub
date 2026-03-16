// =============================================================================
// Milestone Form Component — Create milestone for a deal
// =============================================================================

'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { createMilestone } from '@/actions/deals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/forms/form-field';
import { CurrencyInput } from '@/components/forms/currency-input';
import type { ActionResult } from '@/types';

interface MilestoneFormProps {
  dealId: string;
  nextSortOrder: number;
}

export function MilestoneForm({ dealId, nextSortOrder }: MilestoneFormProps) {
  const t = useTranslations('forms.milestone');
  const [state, formAction, isPending] = useActionState(createMilestone, null);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="deal_id" value={dealId} />
      <input type="hidden" name="sort_order" value={nextSortOrder} />

      {state?.error && !state.fieldErrors && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {state?.data && (
        <div className="rounded-lg bg-success/10 p-3 text-sm text-success">
          {t('successMessage')}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          label={t('titleAr')}
          error={state?.error ? state.fieldErrors?.title_ar?.[0] : undefined}
        >
          <Input
            name="title_ar"
            placeholder={t('titleArPlaceholder')}
            required
          />
        </FormField>

        <FormField
          label={t('titleEn')}
          error={state?.error ? state.fieldErrors?.title_en?.[0] : undefined}
        >
          <Input
            name="title_en"
            placeholder={t('titleEnPlaceholder')}
            dir="ltr"
          />
        </FormField>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          label={t('descAr')}
          error={state?.error ? state.fieldErrors?.description_ar?.[0] : undefined}
        >
          <Textarea
            name="description_ar"
            placeholder={t('descArPlaceholder')}
            rows={3}
          />
        </FormField>

        <FormField
          label={t('descEn')}
          error={state?.error ? state.fieldErrors?.description_en?.[0] : undefined}
        >
          <Textarea
            name="description_en"
            placeholder={t('descEnPlaceholder')}
            dir="ltr"
            rows={3}
          />
        </FormField>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          label={t('dueDate')}
          error={state?.error ? state.fieldErrors?.due_date?.[0] : undefined}
        >
          <Input
            name="due_date"
            type="date"
            dir="ltr"
          />
        </FormField>

        <FormField
          label={t('paymentAmount')}
          error={state?.error ? state.fieldErrors?.payment_amount?.[0] : undefined}
        >
          <CurrencyInput name="payment_amount" />
        </FormField>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? t('creating') : t('createMilestone')}
        </Button>
      </div>
    </form>
  );
}
