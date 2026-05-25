'use client';

import { useActionState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { sendBidInvitation } from '@/actions/bids';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/forms/form-field';
import { AlertBanner } from '@/components/ui/alert-banner';
import type { ActionResult } from '@/types';

interface InviteToBidFormProps {
  /** User's published projects for the selector */
  projects: { id: string; title: string }[];
  /** Available contractors for the selector */
  contractors: { id: string; companyName: string }[];
  /** Called after successful submission (e.g. close modal) */
  onSuccess?: () => void;
}

export function InviteToBidForm({ projects, contractors, onSuccess }: InviteToBidFormProps) {
  const t = useTranslations('dashboard.invitations');
  const [state, formAction, isPending] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(sendBidInvitation, null);

  useEffect(() => {
    if (state?.data) onSuccess?.();
  }, [state?.data, onSuccess]);

  return (
    <form action={formAction} className="space-y-6">
      {state?.data && (
        <AlertBanner variant="success">{t('bidInvitationSent')}</AlertBanner>
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

      {/* Contractor selector */}
      <FormField
        label={t('selectContractor')}
        name="contractor_id"
        error={state?.error ? state.fieldErrors?.contractor_id?.[0] : undefined}
        required
      >
        <select
          name="contractor_id"
          id="contractor_id"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">{t('selectContractorPlaceholder')}</option>
          {contractors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName}
            </option>
          ))}
        </select>
      </FormField>

      {/* Message AR (optional) */}
      <FormField
        label={t('messageAr')}
        name="message_ar"
      >
        <Textarea
          name="message_ar"
          id="message_ar"
          rows={3}
          placeholder={t('messageArPlaceholder')}
        />
      </FormField>

      {/* Message EN (optional) */}
      <FormField
        label={t('messageEn')}
        name="message_en"
      >
        <Textarea
          name="message_en"
          id="message_en"
          rows={3}
          dir="ltr"
          placeholder={t('messageEnPlaceholder')}
        />
      </FormField>

      <Button type="submit" disabled={isPending || !!state?.data} className="w-full">
        {isPending ? t('sending') : t('sendBidInvitation')}
      </Button>
    </form>
  );
}
