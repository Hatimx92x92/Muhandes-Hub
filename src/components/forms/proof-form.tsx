// =============================================================================
// Proof Form Component — Submit proof for a deal
// =============================================================================

'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { submitProof } from '@/actions/deals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/forms/form-field';
import type { ActionResult } from '@/types';

interface ProofFormProps {
  dealId: string;
  milestones: Array<{ id: string; title_ar: string }>;
  maxPercentage: number;
}

export function ProofForm({ dealId, milestones, maxPercentage }: ProofFormProps) {
  const t = useTranslations('forms.proof');
  const [state, formAction, isPending] = useActionState(submitProof, null);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="deal_id" value={dealId} />

      {state?.error && !state.fieldErrors && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {state?.data && (
        <div className="rounded-lg bg-success/10 p-3 text-sm text-success">
          {t('successMessage')}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          label={t('proofType')}
          error={state?.error ? state.fieldErrors?.proof_type?.[0] : undefined}
        >
          <select
            name="proof_type"
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">{t('selectProofType')}</option>
            <option value="work">{t('typeWork')}</option>
            <option value="payment">{t('typePayment')}</option>
            <option value="supply">{t('typeSupply')}</option>
            <option value="handover">{t('typeHandover')}</option>
          </select>
        </FormField>

        {milestones.length > 0 && (
          <FormField
            label={t('milestone')}
            error={state?.error ? state.fieldErrors?.milestone_id?.[0] : undefined}
          >
            <select
              name="milestone_id"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t('noMilestone')}</option>
              {milestones.map(m => (
                <option key={m.id} value={m.id}>{m.title_ar}</option>
              ))}
            </select>
          </FormField>
        )}
      </div>

      <FormField
        label={t('description')}
        error={state?.error ? state.fieldErrors?.description?.[0] : undefined}
      >
        <Textarea
          name="description"
          placeholder={t('descriptionPlaceholder')}
          rows={4}
          required
        />
      </FormField>

      <FormField
        label={t('percentageClaim', { max: maxPercentage })}
        error={state?.error ? state.fieldErrors?.percentage_claim?.[0] : undefined}
      >
        <Input
          name="percentage_claim"
          type="number"
          min={1}
          max={maxPercentage}
          placeholder={`1 - ${maxPercentage}`}
          required
          dir="ltr"
        />
      </FormField>

      {/* File upload placeholder — requires Supabase Storage */}
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {t('attachments')}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('attachmentsLater')}
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? t('submitting') : t('submitProof')}
        </Button>
      </div>
    </form>
  );
}
