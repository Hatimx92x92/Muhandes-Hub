// =============================================================================
// RFQ Form — client component
// =============================================================================

'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/form-field';
import { CurrencyInput } from '@/components/forms/currency-input';
import { createRFQ } from '@/actions/rfqs';
import type { ActionResult } from '@/types';

type State = ActionResult<{ id: string }> | null;

export function RFQForm() {
  const t = useTranslations('forms.rfq');
  const [state, formAction, isPending] = useActionState<State, FormData>(createRFQ, null);

  return (
    <form action={formAction} className="space-y-6">
      {/* Error banner */}
      {state?.error && !state.fieldErrors && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Success */}
      {state?.data && (
        <div className="rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success">
          {t('successMessage')}
        </div>
      )}

      {/* Title */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={t('titleAr')}
          error={state?.error ? state.fieldErrors?.title_ar?.[0] : undefined}
        >
          <Input name="title_ar" placeholder={t('titleArPlaceholder')} required />
        </FormField>
        <FormField
          label={t('titleEn')}
          error={state?.error ? state.fieldErrors?.title_en?.[0] : undefined}
        >
          <Input name="title_en" dir="ltr" placeholder={t('titleEnPlaceholder')} required />
        </FormField>
      </div>

      {/* Description */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={t('descAr')}
          error={state?.error ? state.fieldErrors?.description_ar?.[0] : undefined}
        >
          <Textarea name="description_ar" rows={4} placeholder={t('descArPlaceholder')} required />
        </FormField>
        <FormField
          label={t('descEn')}
          error={state?.error ? state.fieldErrors?.description_en?.[0] : undefined}
        >
          <Textarea name="description_en" rows={4} dir="ltr" placeholder={t('descEnPlaceholder')} required />
        </FormField>
      </div>

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

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? t('creating') : t('createRfq')}
        </Button>
      </div>
    </form>
  );
}
