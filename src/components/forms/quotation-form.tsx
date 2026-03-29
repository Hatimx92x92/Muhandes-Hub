// =============================================================================
// Quotation Form — client component with line-item editor
// =============================================================================

'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/form-field';
import { LineItemEditor } from '@/components/forms/line-item-editor';
import { createQuotation } from '@/actions/quotations';
import { AlertBanner } from '@/components/ui/alert-banner';
import type { ActionResult } from '@/types';

type State = ActionResult<{ id: string; quotation_number: string }> | null;

export function QuotationForm({
  mode = 'standalone',
  recipientId,
  inquiryId,
  rfqResponseId,
  hireRequestId,
}: {
  mode?: 'inquiry_response' | 'standalone';
  recipientId?: string;
  inquiryId?: string;
  rfqResponseId?: string;
  hireRequestId?: string;
}) {
  const t = useTranslations('forms.quotation');
  const [state, formAction, isPending] = useActionState<State, FormData>(createQuotation, null);

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden fields */}
      <input type="hidden" name="mode" value={mode} />
      {recipientId && <input type="hidden" name="recipient_id" value={recipientId} />}
      {inquiryId && <input type="hidden" name="inquiry_id" value={inquiryId} />}
      {rfqResponseId && <input type="hidden" name="rfq_response_id" value={rfqResponseId} />}
      {hireRequestId && <input type="hidden" name="hire_request_id" value={hireRequestId} />}

      {/* Error banner */}
      {state?.error && !state.fieldErrors && (
        <AlertBanner variant="error">{state.error}</AlertBanner>
      )}

      {/* Success banner */}
      {state?.data && (
        <AlertBanner variant="success">{t('successMessage', { number: state.data.quotation_number })}</AlertBanner>
      )}

      {/* Client Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={t('clientName')}
          error={state?.error ? state.fieldErrors?.client_name?.[0] : undefined}
        >
          <Input name="client_name" placeholder={t('clientNamePlaceholder')} />
        </FormField>
        <FormField
          label={t('projectRef')}
          error={state?.error ? state.fieldErrors?.project_ref?.[0] : undefined}
        >
          <Input name="project_ref" placeholder={t('projectRefPlaceholder')} />
        </FormField>
      </div>

      {/* Line Items */}
      <div>
        <h3 className="mb-3 text-base font-semibold text-foreground">{t('lineItemsTitle')}</h3>
        <LineItemEditor
          name="line_items"
          error={state?.error ? state.fieldErrors?.line_items?.[0] : undefined}
        />
      </div>

      {/* Terms */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('validityDays')}>
          <Input
            type="number"
            name="validity_days"
            min={1}
            defaultValue={14}
            placeholder="14"
          />
        </FormField>
      </div>

      {/* Payment & Delivery Terms */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">{t('termsTitle')}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('paymentTermsAr')}>
            <Textarea name="payment_terms_ar" rows={2} placeholder={t('paymentTermsArPlaceholder')} />
          </FormField>
          <FormField label={t('paymentTermsEn')}>
            <Textarea name="payment_terms_en" rows={2} dir="ltr" placeholder={t('paymentTermsEnPlaceholder')} />
          </FormField>
          <FormField label={t('deliveryTermsAr')}>
            <Textarea name="delivery_terms_ar" rows={2} placeholder={t('deliveryTermsArPlaceholder')} />
          </FormField>
          <FormField label={t('deliveryTermsEn')}>
            <Textarea name="delivery_terms_en" rows={2} dir="ltr" placeholder={t('deliveryTermsEnPlaceholder')} />
          </FormField>
        </div>
      </div>

      {/* Notes */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('notesAr')}>
          <Textarea name="notes_ar" rows={3} placeholder={t('notesArPlaceholder')} />
        </FormField>
        <FormField label={t('notesEn')}>
          <Textarea name="notes_en" rows={3} dir="ltr" placeholder={t('notesEnPlaceholder')} />
        </FormField>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? t('creating') : t('createQuotation')}
        </Button>
      </div>
    </form>
  );
}
