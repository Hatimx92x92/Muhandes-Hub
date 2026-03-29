'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { submitBid } from '@/actions/bids';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/forms/currency-input';
import { FormField } from '@/components/forms/form-field';
import { Card } from '@/components/ui/card';
import { AlertBanner } from '@/components/ui/alert-banner';
import type { ActionResult } from '@/types';

interface BidFormProps {
  projectId: string;
  projectTitle: string;
}

export function BidForm({ projectId, projectTitle }: BidFormProps) {
  const t = useTranslations('forms.bid');
  const [state, formAction, isPending] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(submitBid, null);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="project_id" value={projectId} />

      {/* Success message */}
      {state?.data && (
        <AlertBanner variant="success">{t('successMessage')}</AlertBanner>
      )}

      {/* Error message */}
      {state?.error && (
        <AlertBanner variant="error">{state.error}</AlertBanner>
      )}

      {/* Project reference */}
      <Card className="p-4">
        <div className="text-xs text-muted-foreground">{t('biddingOn')}</div>
        <div className="mt-1 font-medium text-foreground">{projectTitle}</div>
      </Card>

      {/* Amount */}
      <FormField
        label={t('amountLabel')}
        error={state?.error ? state.fieldErrors?.amount?.[0] : undefined}
        required
      >
        <CurrencyInput
          name="amount"
          placeholder="0.00"
          showVat
        />
      </FormField>

      {/* Timeline */}
      <FormField
        label={t('timelineDaysLabel')}
        error={state?.error ? state.fieldErrors?.timeline_days?.[0] : undefined}
        required
      >
        <Input
          name="timeline_days"
          type="number"
          min={1}
          placeholder={t('timelinePlaceholder')}
        />
      </FormField>

      {/* Methodology AR */}
      <FormField
        label={t('methodologyArLabel')}
        error={state?.error ? state.fieldErrors?.methodology_ar?.[0] : undefined}
      >
        <Textarea
          name="methodology_ar"
          rows={4}
          placeholder={t('methodologyArPlaceholder')}
        />
      </FormField>

      {/* Methodology EN */}
      <FormField
        label={t('methodologyEnLabel')}
        error={state?.error ? state.fieldErrors?.methodology_en?.[0] : undefined}
      >
        <Textarea
          name="methodology_en"
          rows={4}
          dir="ltr"
          placeholder={t('methodologyEnPlaceholder')}
        />
      </FormField>

      <Button type="submit" disabled={isPending || !!state?.data} className="w-full">
        {isPending ? t('submitting') : t('submitBid')}
      </Button>
    </form>
  );
}
