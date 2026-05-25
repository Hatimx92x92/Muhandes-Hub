'use client';

import { useActionState, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Languages } from 'lucide-react';
import { submitBid } from '@/actions/bids';
import { adminUpdateBid } from '@/actions/admin/moderation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/forms/currency-input';
import { FormField } from '@/components/forms/form-field';
import { Card } from '@/components/ui/card';
import { AlertBanner } from '@/components/ui/alert-banner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Paperclip, X } from 'lucide-react';
import type { ActionResult } from '@/types';

interface BidFormProps {
  mode?: 'create' | 'admin';
  projectId?: string;
  projectTitle?: string;
  defaultValues?: {
    bid_id?: string;
    project_id?: string;
    amount?: number;
    timeline_days?: number;
    methodology_ar?: string;
    methodology_en?: string;
    status?: string;
    projectTitle?: string;
  };
}

export function BidForm({ mode = 'create', projectId, projectTitle, defaultValues }: BidFormProps) {
  const t = useTranslations('forms.bid');
  const tCommon = useTranslations('common');
  const locale = useLocale() as 'ar' | 'en';
  const [methodologyExpanded, setMethodologyExpanded] = useState(false);
  const action = mode === 'admin' ? adminUpdateBid : submitBid;
  const [state, formAction, isPending] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(
    action as (state: ActionResult<{ id: string }> | null, formData: FormData) => Promise<ActionResult<{ id: string }>>,
    null,
  );

  const resolvedProjectId = projectId || defaultValues?.project_id;
  const resolvedProjectTitle = projectTitle || defaultValues?.projectTitle;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Derive default timeline value and unit from timeline_days
  const defaultTimelineUnit = defaultValues?.timeline_days
    ? defaultValues.timeline_days >= 365 && defaultValues.timeline_days % 365 === 0
      ? 'years'
      : defaultValues.timeline_days >= 30 && defaultValues.timeline_days % 30 === 0
        ? 'months'
        : 'days'
    : 'days';
  const defaultTimelineValue = defaultValues?.timeline_days
    ? defaultTimelineUnit === 'years'
      ? defaultValues.timeline_days / 365
      : defaultTimelineUnit === 'months'
        ? defaultValues.timeline_days / 30
        : defaultValues.timeline_days
    : undefined;

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Custom form action that appends files to FormData
  const handleSubmit = (formData: FormData) => {
    // Remove any existing bid_attachments entries
    formData.delete('bid_attachments');
    // Append selected files
    for (const file of selectedFiles) {
      formData.append('bid_attachments', file);
    }
    formAction(formData);
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="project_id" value={resolvedProjectId || ''} />
      {mode === 'admin' && defaultValues?.bid_id && (
        <input type="hidden" name="bid_id" value={defaultValues.bid_id} />
      )}

      {/* Admin: Status control */}
      {mode === 'admin' && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">{t('statusTitle')}</h2>
          <Select name="status" defaultValue={defaultValues?.status || 'pending'}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">{t('statusPending')}</SelectItem>
              <SelectItem value="accepted">{t('statusAccepted')}</SelectItem>
              <SelectItem value="rejected">{t('statusRejected')}</SelectItem>
              <SelectItem value="withdrawn">{t('statusWithdrawn')}</SelectItem>
            </SelectContent>
          </Select>
        </section>
      )}

      {/* Success message */}
      {state?.data && (
        <AlertBanner variant="success">{mode === 'create' ? t('successMessage') : t('updateSuccess')}</AlertBanner>
      )}

      {/* Error message */}
      {state?.error && (
        <AlertBanner variant="error">{state.error}</AlertBanner>
      )}

      {/* Project reference */}
      {resolvedProjectTitle && (
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">{t('biddingOn')}</div>
          <div className="mt-1 font-medium text-foreground">{resolvedProjectTitle}</div>
        </Card>
      )}

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
          defaultValue={defaultValues?.amount}
        />
      </FormField>

      {/* Timeline — value + unit picker */}
      <FormField
        label={t('timelineLabel')}
        error={state?.error ? (state.fieldErrors?.timeline_value?.[0] || state.fieldErrors?.timeline_unit?.[0]) : undefined}
        required
      >
        <div className="flex gap-3">
          <Input
            name="timeline_value"
            type="number"
            min={1}
            placeholder={t('timelineValuePlaceholder')}
            defaultValue={defaultTimelineValue?.toString()}
            className="flex-1"
          />
          <Select name="timeline_unit" defaultValue={defaultTimelineUnit}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">{t('unitDays')}</SelectItem>
              <SelectItem value="months">{t('unitMonths')}</SelectItem>
              <SelectItem value="years">{t('unitYears')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormField>

      {/* Methodology — locale-appropriate field + optional secondary */}
      {mode === 'admin' ? (
        <>
          <FormField
            label={t('methodologyArLabel')}
            error={state?.error ? state.fieldErrors?.methodology_ar?.[0] : undefined}
          >
            <Textarea
              name="methodology_ar"
              rows={4}
              placeholder={t('methodologyArPlaceholder')}
              defaultValue={defaultValues?.methodology_ar}
            />
          </FormField>
          <FormField
            label={t('methodologyEnLabel')}
            error={state?.error ? state.fieldErrors?.methodology_en?.[0] : undefined}
          >
            <Textarea
              name="methodology_en"
              rows={4}
              dir="ltr"
              placeholder={t('methodologyEnPlaceholder')}
              defaultValue={defaultValues?.methodology_en}
            />
          </FormField>
        </>
      ) : (
        <div className="space-y-2">
          {locale === 'ar' ? (
            <FormField
              label={t('methodologyArLabel')}
              error={state?.error ? state.fieldErrors?.methodology_ar?.[0] : undefined}
            >
              <Textarea
                name="methodology_ar"
                rows={4}
                placeholder={t('methodologyArPlaceholder')}
                defaultValue={defaultValues?.methodology_ar}
              />
            </FormField>
          ) : (
            <FormField
              label={t('methodologyEnLabel')}
              error={state?.error ? state.fieldErrors?.methodology_en?.[0] : undefined}
            >
              <Textarea
                name="methodology_en"
                rows={4}
                dir="ltr"
                placeholder={t('methodologyEnPlaceholder')}
                defaultValue={defaultValues?.methodology_en}
              />
            </FormField>
          )}

          {/* Secondary language expand */}
          {methodologyExpanded && (
            <div className="space-y-1 border-s-2 border-border ps-3">
              {locale === 'ar' ? (
                <FormField
                  label={t('methodologyEnLabel')}
                  error={state?.error ? state.fieldErrors?.methodology_en?.[0] : undefined}
                >
                  <Textarea
                    name="methodology_en"
                    rows={4}
                    dir="ltr"
                    placeholder={t('methodologyEnPlaceholder')}
                    defaultValue={defaultValues?.methodology_en}
                  />
                </FormField>
              ) : (
                <FormField
                  label={t('methodologyArLabel')}
                  error={state?.error ? state.fieldErrors?.methodology_ar?.[0] : undefined}
                >
                  <Textarea
                    name="methodology_ar"
                    rows={4}
                    placeholder={t('methodologyArPlaceholder')}
                    defaultValue={defaultValues?.methodology_ar}
                  />
                </FormField>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setMethodologyExpanded((p) => !p)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Languages className="h-3.5 w-3.5" />
            {methodologyExpanded
              ? tCommon('hideTranslation')
              : locale === 'ar'
                ? tCommon('addEnglishTranslation')
                : tCommon('addArabicTranslation')}
          </button>
        </div>
      )}

      {/* Attachments */}
      {mode === 'create' && (
        <FormField label={t('attachmentsLabel')}>
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleFileSelect}>
              <Paperclip className="h-4 w-4 me-1.5" />
              {t('addAttachment')}
            </Button>
            {selectedFiles.length > 0 && (
              <ul className="space-y-2">
                {selectedFiles.map((file, idx) => (
                  <li key={`${file.name}-${idx}`} className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
                    <span className="truncate text-foreground">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="ms-2 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">{t('attachmentsHint')}</p>
          </div>
        </FormField>
      )}

      <Button type="submit" disabled={isPending || (mode === 'create' && !!state?.data)} className="w-full">
        {isPending
          ? (mode === 'create' ? t('submitting') : t('saving'))
          : (mode === 'create' ? t('submitBid') : t('saveChanges'))}
      </Button>
    </form>
  );
}
