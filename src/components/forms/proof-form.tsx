// =============================================================================
// Proof Form Component — Submit proof for a deal
// =============================================================================

'use client';

import { useActionState, useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { submitProof } from '@/actions/deals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/forms/form-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getLocaleField } from '@/lib/utils';

interface ProofFormProps {
  dealId: string;
  milestones: Array<{ id: string; title_ar: string; title_en?: string | null }>;
  maxPercentage: number;
}

export function ProofForm({ dealId, milestones, maxPercentage }: ProofFormProps) {
  const t = useTranslations('forms.proof');
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(submitProof, null);
  const [submitKey, setSubmitKey] = useState(0);
  const prevDataRef = useRef<unknown>(undefined);

  useEffect(() => {
    if (state?.data && state.data !== prevDataRef.current) {
      prevDataRef.current = state.data;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubmitKey(k => k + 1);
    }
  }, [state?.data]);

  return (
    <form key={submitKey} action={formAction} className="space-y-6">
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
          <Select name="proof_type" required defaultValue="">
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('selectProofType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="work">{t('typeWork')}</SelectItem>
              <SelectItem value="payment">{t('typePayment')}</SelectItem>
              <SelectItem value="supply">{t('typeSupply')}</SelectItem>
              <SelectItem value="handover">{t('typeHandover')}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        {milestones.length > 0 && (
          <FormField
            label={t('milestone')}
            error={state?.error ? state.fieldErrors?.milestone_id?.[0] : undefined}
          >
            <Select name="milestone_id" defaultValue="">
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('noMilestone')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('noMilestone')}</SelectItem>
                {milestones.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {getLocaleField(m, 'title', locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
