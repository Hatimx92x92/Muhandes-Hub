// =============================================================================
// RFQ Response Form — supplier responds to published RFQ
// =============================================================================

'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/form-field';
import { CurrencyInput } from '@/components/forms/currency-input';
import { respondToRFQ } from '@/actions/rfqs';
import type { ActionResult } from '@/types';

type State = ActionResult<{ id: string }> | null;

export function RFQResponseForm({ rfqId }: { rfqId: string }) {
  const t = useTranslations('forms.rfqResponse');
  const [state, formAction, isPending] = useActionState<State, FormData>(respondToRFQ, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="rfq_id" value={rfqId} />

      {state?.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {state?.data && (
        <div className="rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success">
          {t('successMessage')}
        </div>
      )}

      {/* Pricing — stored as JSON */}
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t('unitPrice')}>
          <CurrencyInput name="unit_price_field" placeholder="0.00" />
        </FormField>
        <FormField label={t('totalPrice')}>
          <CurrencyInput name="total_price_field" placeholder="0.00" />
        </FormField>
        <FormField label={t('leadTime')}>
          <Input type="number" name="lead_time_field" min={1} placeholder="7" />
        </FormField>
      </div>

      {/* Hidden pricing JSON — assembled from fields */}
      <input
        type="hidden"
        name="pricing"
        id="pricing_json"
      />

      {/* Delivery Terms */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('deliveryTermsAr')}>
          <Textarea name="delivery_terms_ar" rows={2} placeholder={t('deliveryTermsArPlaceholder')} />
        </FormField>
        <FormField label={t('deliveryTermsEn')}>
          <Textarea name="delivery_terms_en" rows={2} dir="ltr" placeholder={t('deliveryTermsEnPlaceholder')} />
        </FormField>
      </div>

      {/* Notes */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('notesAr')}>
          <Textarea name="notes_ar" rows={2} placeholder={t('notesArPlaceholder')} />
        </FormField>
        <FormField label={t('notesEn')}>
          <Textarea name="notes_en" rows={2} dir="ltr" placeholder={t('notesEnPlaceholder')} />
        </FormField>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? t('submitting') : t('submitResponse')}
        </Button>
      </div>
    </form>
  );
}
