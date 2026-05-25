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
import { createQuotation, updateQuotation } from '@/actions/quotations';
import { adminUpdateQuotation } from '@/actions/admin/moderation';
import { AlertBanner } from '@/components/ui/alert-banner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionResult } from '@/types';

type State = ActionResult<{ id: string; quotation_number: string }> | null;

interface QuotationFormDefaultValues {
  quotation_id?: string;
  mode?: 'inquiry_response' | 'standalone';
  recipient_id?: string;
  inquiry_id?: string;
  rfq_response_id?: string;
  hire_request_id?: string;
  client_name?: string;
  project_ref?: string;
  line_items?: Array<{ description: string; quantity: number; unit: string; unit_price: number; total?: number }>;
  validity_days?: number;
  payment_terms_ar?: string;
  payment_terms_en?: string;
  delivery_terms_ar?: string;
  delivery_terms_en?: string;
  notes_ar?: string;
  notes_en?: string;
  status?: string;
}

export function QuotationForm({
  formMode = 'create',
  mode = 'standalone',
  recipientId,
  inquiryId,
  rfqResponseId,
  hireRequestId,
  defaultValues,
}: {
  formMode?: 'create' | 'edit' | 'admin';
  mode?: 'inquiry_response' | 'standalone';
  recipientId?: string;
  inquiryId?: string;
  rfqResponseId?: string;
  hireRequestId?: string;
  defaultValues?: QuotationFormDefaultValues;
}) {
  const t = useTranslations('forms.quotation');
  const action = formMode === 'admin'
    ? adminUpdateQuotation
    : formMode === 'edit'
      ? updateQuotation
      : createQuotation;
  const [state, formAction, isPending] = useActionState<State, FormData>(
    action as (state: State, formData: FormData) => Promise<ActionResult<{ id: string; quotation_number: string }>>,
    null,
  );

  const resolvedMode = defaultValues?.mode || mode;
  const resolvedRecipientId = recipientId || defaultValues?.recipient_id;
  const resolvedInquiryId = inquiryId || defaultValues?.inquiry_id;
  const resolvedRfqResponseId = rfqResponseId || defaultValues?.rfq_response_id;
  const resolvedHireRequestId = hireRequestId || defaultValues?.hire_request_id;

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden fields */}
      <input type="hidden" name="mode" value={resolvedMode} />
      {(formMode === 'edit' || formMode === 'admin') && defaultValues?.quotation_id && (
        <input type="hidden" name="quotation_id" value={defaultValues.quotation_id} />
      )}
      {resolvedRecipientId && <input type="hidden" name="recipient_id" value={resolvedRecipientId} />}
      {resolvedInquiryId && <input type="hidden" name="inquiry_id" value={resolvedInquiryId} />}
      {resolvedRfqResponseId && <input type="hidden" name="rfq_response_id" value={resolvedRfqResponseId} />}
      {resolvedHireRequestId && <input type="hidden" name="hire_request_id" value={resolvedHireRequestId} />}

      {/* Admin: Status control */}
      {formMode === 'admin' && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">{t('statusTitle')}</h2>
          <Select name="status" defaultValue={defaultValues?.status || 'draft'}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">{t('statusDraft')}</SelectItem>
              <SelectItem value="sent">{t('statusSent')}</SelectItem>
              <SelectItem value="viewed">{t('statusViewed')}</SelectItem>
              <SelectItem value="accepted">{t('statusAccepted')}</SelectItem>
              <SelectItem value="rejected">{t('statusRejected')}</SelectItem>
              <SelectItem value="expired">{t('statusExpired')}</SelectItem>
            </SelectContent>
          </Select>
        </section>
      )}

      {/* Error banner */}
      {state?.error && !state.fieldErrors && (
        <AlertBanner variant="error">{state.error}</AlertBanner>
      )}

      {/* Success banner */}
      {state?.data && (
        <AlertBanner variant="success">
          {formMode === 'create'
            ? t('successMessage', { number: state.data.quotation_number })
            : t('updateSuccess')}
        </AlertBanner>
      )}

      {/* Client Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={t('clientName')}
          error={state?.error ? state.fieldErrors?.client_name?.[0] : undefined}
        >
          <Input name="client_name" placeholder={t('clientNamePlaceholder')} defaultValue={defaultValues?.client_name} />
        </FormField>
        <FormField
          label={t('projectRef')}
          error={state?.error ? state.fieldErrors?.project_ref?.[0] : undefined}
        >
          <Input name="project_ref" placeholder={t('projectRefPlaceholder')} defaultValue={defaultValues?.project_ref} />
        </FormField>
      </div>

      {/* Line Items */}
      <div>
        <h3 className="mb-3 text-base font-semibold text-foreground">{t('lineItemsTitle')}</h3>
        <LineItemEditor
          name="line_items"
          error={state?.error ? state.fieldErrors?.line_items?.[0] : undefined}
          defaultItems={defaultValues?.line_items}
        />
      </div>

      {/* Terms */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('validityDays')}>
          <Input
            type="number"
            name="validity_days"
            min={1}
            defaultValue={defaultValues?.validity_days ?? 14}
            placeholder="14"
          />
        </FormField>
      </div>

      {/* Payment & Delivery Terms */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">{t('termsTitle')}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('paymentTermsAr')}>
            <Textarea name="payment_terms_ar" rows={2} placeholder={t('paymentTermsArPlaceholder')} defaultValue={defaultValues?.payment_terms_ar} />
          </FormField>
          <FormField label={t('paymentTermsEn')}>
            <Textarea name="payment_terms_en" rows={2} dir="ltr" placeholder={t('paymentTermsEnPlaceholder')} defaultValue={defaultValues?.payment_terms_en} />
          </FormField>
          <FormField label={t('deliveryTermsAr')}>
            <Textarea name="delivery_terms_ar" rows={2} placeholder={t('deliveryTermsArPlaceholder')} defaultValue={defaultValues?.delivery_terms_ar} />
          </FormField>
          <FormField label={t('deliveryTermsEn')}>
            <Textarea name="delivery_terms_en" rows={2} dir="ltr" placeholder={t('deliveryTermsEnPlaceholder')} defaultValue={defaultValues?.delivery_terms_en} />
          </FormField>
        </div>
      </div>

      {/* Notes */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('notesAr')}>
          <Textarea name="notes_ar" rows={3} placeholder={t('notesArPlaceholder')} defaultValue={defaultValues?.notes_ar} />
        </FormField>
        <FormField label={t('notesEn')}>
          <Textarea name="notes_en" rows={3} dir="ltr" placeholder={t('notesEnPlaceholder')} defaultValue={defaultValues?.notes_en} />
        </FormField>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? (formMode === 'create' ? t('creating') : t('saving'))
            : (formMode === 'create' ? t('createQuotation') : t('saveChanges'))}
        </Button>
      </div>
    </form>
  );
}
