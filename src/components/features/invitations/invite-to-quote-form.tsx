'use client';

import { useActionState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { sendQuoteInvitation } from '@/actions/inquiries';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/forms/form-field';
import { AlertBanner } from '@/components/ui/alert-banner';
import type { ActionResult } from '@/types';

interface InviteToQuoteFormProps {
  /** User's published projects for the selector */
  projects: { id: string; title: string }[];
  /** Available suppliers for the selector */
  suppliers: { id: string; companyName: string }[];
  /** Called after successful submission (e.g. close modal) */
  onSuccess?: () => void;
}

export function InviteToQuoteForm({ projects, suppliers, onSuccess }: InviteToQuoteFormProps) {
  const t = useTranslations('dashboard.invitations');
  const [state, formAction, isPending] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(sendQuoteInvitation, null);

  useEffect(() => {
    if (state?.data) onSuccess?.();
  }, [state?.data, onSuccess]);

  return (
    <form action={formAction} className="space-y-6">
      {state?.data && (
        <AlertBanner variant="success">{t('quoteInvitationSent')}</AlertBanner>
      )}
      {state?.error && (
        <AlertBanner variant="error">{state.error}</AlertBanner>
      )}

      {/* Project selector */}
      <FormField
        label={t('selectProject')}
        name="project_id"
        error={state?.error ? state.fieldErrors?.project_id?.[0] : undefined}
        required
      >
        <select
          name="project_id"
          id="project_id"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">{t('selectProjectPlaceholder')}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </FormField>

      {/* Supplier selector */}
      <FormField
        label={t('selectSupplier')}
        name="supplier_id"
        error={state?.error ? state.fieldErrors?.supplier_id?.[0] : undefined}
        required
      >
        <select
          name="supplier_id"
          id="supplier_id"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">{t('selectSupplierPlaceholder')}</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.companyName}
            </option>
          ))}
        </select>
      </FormField>

      {/* Description AR */}
      <FormField
        label={t('descriptionAr')}
        name="description_ar"
        error={state?.error ? state.fieldErrors?.description_ar?.[0] : undefined}
        required
      >
        <Textarea
          name="description_ar"
          id="description_ar"
          rows={4}
          placeholder={t('descriptionArPlaceholder')}
        />
      </FormField>

      {/* Description EN */}
      <FormField
        label={t('descriptionEn')}
        name="description_en"
        error={state?.error ? state.fieldErrors?.description_en?.[0] : undefined}
      >
        <Textarea
          name="description_en"
          id="description_en"
          rows={4}
          dir="ltr"
          placeholder={t('descriptionEnPlaceholder')}
        />
      </FormField>

      <Button type="submit" disabled={isPending || !!state?.data} className="w-full">
        {isPending ? t('sending') : t('sendQuoteInvitation')}
      </Button>
    </form>
  );
}
