// =============================================================================
// RFQ Form — client component
// =============================================================================

'use client';

import { useActionState, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BilingualFieldPair } from '@/components/ui/bilingual-field-pair';
import { FormField } from '@/components/forms/form-field';
import { AlertBanner } from '@/components/ui/alert-banner';
import { CurrencyInput } from '@/components/forms/currency-input';
import { FileUpload } from '@/components/forms/file-upload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductSelector } from '@/components/forms/product-selector';
import { createRFQ, updateRFQ, removeRFQFile } from '@/actions/rfqs';
import { adminUpdateRFQ } from '@/actions/admin/moderation';
import { getProxyUrl } from '@/lib/file-utils';
import { FileText, X } from 'lucide-react';
import type { ActionResult } from '@/types';

type State = ActionResult<{ id: string }> | null;

interface ExistingFile {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  category: string;
  mime_type?: string;
}

interface RFQFormProps {
  mode?: 'create' | 'edit' | 'admin';
  defaultValues?: {
    rfq_id?: string;
    title_ar?: string;
    title_en?: string;
    description_ar?: string;
    description_en?: string;
    quantity?: number;
    budget_min?: number;
    budget_max?: number;
    deadline?: string;
    city?: string;
    product_id?: string;
    status?: string;
    existingFiles?: ExistingFile[];
  };
}

export function RFQForm({ mode = 'create', defaultValues }: RFQFormProps) {
  const t = useTranslations('forms.rfq');
  const tFiles = useTranslations('forms.rfq.files');
  const action = mode === 'admin' ? adminUpdateRFQ : mode === 'edit' ? updateRFQ : createRFQ;
  const [state, formAction, isPending] = useActionState<State, FormData>(
    action as (state: State, formData: FormData) => Promise<ActionResult<{ id: string }>>,
    null,
  );
  const [rfqFiles, setRfqFiles] = useState<File[]>([]);
  const [fileCategory, setFileCategory] = useState('general');
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>(defaultValues?.existingFiles ?? []);
  const [isRemoving, startRemoveTransition] = useTransition();

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
      {/* Hidden fields */}
      {(mode === 'edit' || mode === 'admin') && defaultValues?.rfq_id && (
        <input type="hidden" name="rfq_id" value={defaultValues.rfq_id} />
      )}

      {/* Admin: Status control */}
      {mode === 'admin' && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">{t('statusTitle')}</h2>
          <Select name="status" defaultValue={defaultValues?.status || 'draft'}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">{t('statusDraft')}</SelectItem>
              <SelectItem value="pending">{t('statusPending')}</SelectItem>
              <SelectItem value="published">{t('statusPublished')}</SelectItem>
              <SelectItem value="rejected">{t('statusRejected')}</SelectItem>
              <SelectItem value="closed">{t('statusClosed')}</SelectItem>
            </SelectContent>
          </Select>
        </section>
      )}

      {/* Error banner */}
      {state?.error && !state.fieldErrors && (
        <AlertBanner variant="error">{state.error}</AlertBanner>
      )}

      {/* Success */}
      {state?.data && (
        <AlertBanner variant="success">{mode === 'create' ? t('successMessage') : t('updateSuccess')}</AlertBanner>
      )}

      {/* Title */}
      <BilingualFieldPair
        baseName="title"
        labelAr={t('titleAr')}
        labelEn={t('titleEn')}
        placeholderAr={t('titleArPlaceholder')}
        placeholderEn={t('titleEnPlaceholder')}
        defaultValueAr={defaultValues?.title_ar}
        defaultValueEn={defaultValues?.title_en}
        errorAr={state?.error ? state.fieldErrors?.title_ar?.[0] : undefined}
        errorEn={state?.error ? state.fieldErrors?.title_en?.[0] : undefined}
        required
        showBothLanguages={mode === 'admin'}
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
        defaultValueAr={defaultValues?.description_ar}
        defaultValueEn={defaultValues?.description_en}
        errorAr={state?.error ? state.fieldErrors?.description_ar?.[0] : undefined}
        errorEn={state?.error ? state.fieldErrors?.description_en?.[0] : undefined}
        required
        showBothLanguages={mode === 'admin'}
      />

      {/* Quantity & Budget */}
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label={t('quantity')}>
          <Input type="number" name="quantity" min={1} placeholder="100" defaultValue={defaultValues?.quantity?.toString()} />
        </FormField>
        <FormField
          label={t('budgetMin')}
          error={state?.error ? state.fieldErrors?.budget_min?.[0] : undefined}
        >
          <CurrencyInput name="budget_min" placeholder="0.00" defaultValue={defaultValues?.budget_min} />
        </FormField>
        <FormField
          label={t('budgetMax')}
          error={state?.error ? state.fieldErrors?.budget_max?.[0] : undefined}
        >
          <CurrencyInput name="budget_max" placeholder="0.00" defaultValue={defaultValues?.budget_max} />
        </FormField>
      </div>

      {/* Deadline & City */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('deadline')}>
          <Input type="date" name="deadline" defaultValue={defaultValues?.deadline?.split('T')[0]} />
        </FormField>
        <FormField label={t('city')}>
          <Select name="city" defaultValue={defaultValues?.city || ''}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('allCities')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('allCities')}</SelectItem>
              <SelectItem value="riyadh">الرياض</SelectItem>
              <SelectItem value="jeddah">جدة</SelectItem>
              <SelectItem value="dammam">الدمام</SelectItem>
              <SelectItem value="mecca">مكة المكرمة</SelectItem>
              <SelectItem value="medina">المدينة المنورة</SelectItem>
              <SelectItem value="khobar">الخبر</SelectItem>
              <SelectItem value="tabuk">تبوك</SelectItem>
              <SelectItem value="abha">أبها</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {/* Product Selector */}
      <ProductSelector name="product_id" defaultValue={defaultValues?.product_id} />

      {/* Existing files (edit/admin mode) */}
      {(mode === 'edit' || mode === 'admin') && existingFiles.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-foreground">{tFiles('existingFiles')}</h3>
          <ul className="space-y-2">
            {existingFiles.map((file) => (
              <li
                key={file.id}
                className="flex items-center gap-2 rounded-lg border p-2 text-sm"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize text-muted-foreground">
                  {tFiles(file.category as 'boq' | 'drawings' | 'specs' | 'general')}
                </span>
                <a
                  href={getProxyUrl(file.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-primary underline-offset-2 hover:underline"
                >
                  {file.file_name}
                </a>
                <span className="text-xs text-muted-foreground">
                  {(file.file_size / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  disabled={isRemoving}
                  onClick={() => {
                    if (!defaultValues?.rfq_id) return;
                    startRemoveTransition(async () => {
                      await removeRFQFile(defaultValues.rfq_id!, file.id);
                      setExistingFiles((prev) => prev.filter((f) => f.id !== file.id));
                    });
                  }}
                  className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Attachments */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">{tFiles('title')}</h3>
        <p className="mb-3 text-xs text-muted-foreground">{tFiles('hint')}</p>

        <div className="mb-3">
          <label htmlFor="rfq_file_category" className="mb-1.5 block text-sm font-medium text-foreground">
            {tFiles('category')}
          </label>
          <Select value={fileCategory} onValueChange={(v) => setFileCategory(v ?? '')}>
            <SelectTrigger className="w-full sm:w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">{tFiles('general')}</SelectItem>
              <SelectItem value="boq">{tFiles('boq')}</SelectItem>
              <SelectItem value="drawings">{tFiles('drawings')}</SelectItem>
              <SelectItem value="specs">{tFiles('specs')}</SelectItem>
            </SelectContent>
          </Select>
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
          {isPending
            ? (mode === 'create' ? t('creating') : t('saving'))
            : (mode === 'create' ? t('createRfq') : t('saveChanges'))}
        </Button>
      </div>
    </form>
  );
}
