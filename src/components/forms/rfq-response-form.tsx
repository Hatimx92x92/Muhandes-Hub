// =============================================================================
// RFQ Response Form — supplier responds to published RFQ
// =============================================================================

'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BilingualFieldPair } from '@/components/ui/bilingual-field-pair';
import { FormField } from '@/components/forms/form-field';
import { CurrencyInput } from '@/components/forms/currency-input';
import { respondToRFQ } from '@/actions/rfqs';
import { AlertBanner } from '@/components/ui/alert-banner';
import type { ActionResult } from '@/types';

type State = ActionResult<{ id: string }> | null;

export function RFQResponseForm({ rfqId }: { rfqId: string }) {
  const t = useTranslations('forms.rfqResponse');
  const [state, formAction, isPending] = useActionState<State, FormData>(respondToRFQ, null);

  function handleSubmit(formData: FormData) {
    // Assemble pricing JSON from individual fields
    const pricing = {
      unit_price: parseFloat(formData.get('unit_price_field') as string) || 0,
      total_price: parseFloat(formData.get('total_price_field') as string) || 0,
      lead_time: parseInt(formData.get('lead_time_field') as string) || 0,
    };
    formData.set('pricing', JSON.stringify(pricing));
    return formAction(formData);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="rfq_id" value={rfqId} />

      {state?.error && (
        <AlertBanner variant="error">{state.error}</AlertBanner>
      )}

      {state?.data && (
        <AlertBanner variant="success">{t('successMessage')}</AlertBanner>
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
      <BilingualFieldPair
        baseName="delivery_terms"
        type="textarea"
        rows={2}
        labelAr={t('deliveryTermsAr')}
        labelEn={t('deliveryTermsEn')}
        placeholderAr={t('deliveryTermsArPlaceholder')}
        placeholderEn={t('deliveryTermsEnPlaceholder')}
      />

      {/* Notes */}
      <BilingualFieldPair
        baseName="notes"
        type="textarea"
        rows={2}
        labelAr={t('notesAr')}
        labelEn={t('notesEn')}
        placeholderAr={t('notesArPlaceholder')}
        placeholderEn={t('notesEnPlaceholder')}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? t('submitting') : t('submitResponse')}
        </Button>
      </div>
    </form>
  );
}
