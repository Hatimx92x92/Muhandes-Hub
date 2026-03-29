// =============================================================================
// RFQ Form — client component
// =============================================================================

'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BilingualFieldPair } from '@/components/ui/bilingual-field-pair';
import { FormField } from '@/components/forms/form-field';
import { AlertBanner } from '@/components/ui/alert-banner';
import { CurrencyInput } from '@/components/forms/currency-input';
import { FileUpload } from '@/components/forms/file-upload';
import { ProductSelector } from '@/components/forms/product-selector';
import { createRFQ } from '@/actions/rfqs';
import type { ActionResult } from '@/types';

type State = ActionResult<{ id: string }> | null;

export function RFQForm() {
  const t = useTranslations('forms.rfq');
  const tFiles = useTranslations('forms.rfq.files');
  const [state, formAction, isPending] = useActionState<State, FormData>(createRFQ, null);
  const [rfqFiles, setRfqFiles] = useState<File[]>([]);
  const [fileCategory, setFileCategory] = useState('general');

  return (
    <form
      action={(formData) => {
        // Append files with their category
        rfqFiles.forEach((file) => {
          formData.append('rfq_files', file);
        });
        if (rfqFiles.length > 0) {
          formData.set('file_category', fileCategory);
        }
        formAction(formData);
      }}
      className="space-y-6"
    >
      {/* Error banner */}
      {state?.error && !state.fieldErrors && (
        <AlertBanner variant="error">{state.error}</AlertBanner>
      )}

      {/* Success */}
      {state?.data && (
        <AlertBanner variant="success">{t('successMessage')}</AlertBanner>
      )}

      {/* Title */}
      <BilingualFieldPair
        baseName="title"
        labelAr={t('titleAr')}
        labelEn={t('titleEn')}
        placeholderAr={t('titleArPlaceholder')}
        placeholderEn={t('titleEnPlaceholder')}
        errorAr={state?.error ? state.fieldErrors?.title_ar?.[0] : undefined}
        errorEn={state?.error ? state.fieldErrors?.title_en?.[0] : undefined}
        required
      />

      {/* Description */}
      <BilingualFieldPair
        baseName="description"
        type="textarea"
        rows={4}
        labelAr={t('descAr')}
        labelEn={t('descEn')}
        placeholderAr={t('descArPlaceholder')}
        placeholderEn={t('descEnPlaceholder')}
        errorAr={state?.error ? state.fieldErrors?.description_ar?.[0] : undefined}
        errorEn={state?.error ? state.fieldErrors?.description_en?.[0] : undefined}
        required
      />

      {/* Quantity & Budget */}
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t('quantity')}>
          <Input type="number" name="quantity" min={1} placeholder="100" />
        </FormField>
        <FormField
          label={t('budgetMin')}
          error={state?.error ? state.fieldErrors?.budget_min?.[0] : undefined}
        >
          <CurrencyInput name="budget_min" placeholder="0.00" />
        </FormField>
        <FormField
          label={t('budgetMax')}
          error={state?.error ? state.fieldErrors?.budget_max?.[0] : undefined}
        >
          <CurrencyInput name="budget_max" placeholder="0.00" />
        </FormField>
      </div>

      {/* Deadline & City */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('deadline')}>
          <Input type="date" name="deadline" />
        </FormField>
        <FormField label={t('city')}>
          <select
            suppressHydrationWarning
            name="city"
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="">{t('allCities')}</option>
            <option value="riyadh">الرياض</option>
            <option value="jeddah">جدة</option>
            <option value="dammam">الدمام</option>
            <option value="mecca">مكة المكرمة</option>
            <option value="medina">المدينة المنورة</option>
            <option value="khobar">الخبر</option>
            <option value="tabuk">تبوك</option>
            <option value="abha">أبها</option>
          </select>
        </FormField>
      </div>

      {/* Product Selector */}
      <ProductSelector name="product_id" />

      {/* Attachments */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">{tFiles('title')}</h3>
        <p className="mb-3 text-xs text-muted-foreground">{tFiles('hint')}</p>

        <div className="mb-3">
          <label htmlFor="rfq_file_category" className="mb-1.5 block text-sm font-medium text-foreground">
            {tFiles('category')}
          </label>
          <select
            suppressHydrationWarning
            id="rfq_file_category"
            value={fileCategory}
            onChange={(e) => setFileCategory(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-auto"
          >
            <option value="general">{tFiles('general')}</option>
            <option value="boq">{tFiles('boq')}</option>
            <option value="drawings">{tFiles('drawings')}</option>
            <option value="specs">{tFiles('specs')}</option>
          </select>
        </div>

        <FileUpload
          name="rfq_files_input"
          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp"
          multiple
          maxSize={10}
          maxFiles={10}
          hint={tFiles('fileLimit')}
          onUpload={setRfqFiles}
        />
      </section>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? t('creating') : t('createRfq')}
        </Button>
      </div>
    </form>
  );
}
