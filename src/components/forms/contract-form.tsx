// =============================================================================
// Contract Form — Client Component
// =============================================================================

'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/forms/form-field';
import { createContract } from '@/actions/contracts';
import type { ActionResult } from '@/types';

interface ContractFormProps {
  dealId?: string;
  profile: Record<string, unknown>;
  dealInfo: { deal: Record<string, unknown>; counterparty: Record<string, unknown> } | null;
  clauses: Array<Record<string, unknown>>;
}

type State = ActionResult<{ id: string }> | null;

export function ContractForm({ dealId, profile, dealInfo, clauses }: ContractFormProps) {
  const t = useTranslations('forms.contract');
  const [state, formAction, isPending] = useActionState<State, FormData>(createContract, null);

  // Auto-fill Party A from profile
  const partyA = {
    name: (profile.full_name_ar as string) || '',
    company_name_ar: (profile.company_name_ar as string) || '',
    company_name_en: (profile.company_name_en as string) || '',
    cr_number: (profile.cr_number as string) || '',
    vat_number: (profile.vat_number as string) || '',
    phone: (profile.phone as string) || '',
    email: (profile.email as string) || '',
  };

  // Auto-fill Party B from deal counterparty
  const partyB = dealInfo ? {
    name: (dealInfo.counterparty?.full_name_ar as string) || '',
    company_name_ar: (dealInfo.counterparty?.company_name_ar as string) || '',
    company_name_en: (dealInfo.counterparty?.company_name_en as string) || '',
    cr_number: (dealInfo.counterparty?.cr_number as string) || '',
    vat_number: (dealInfo.counterparty?.vat_number as string) || '',
    phone: (dealInfo.counterparty?.phone as string) || '',
    email: (dealInfo.counterparty?.email as string) || '',
  } : { name: '', company_name_ar: '', company_name_en: '', cr_number: '', vat_number: '', phone: '', email: '' };

  return (
    <form action={formAction} className="space-y-8">
      {dealId && <input type="hidden" name="deal_id" value={dealId} />}
      <input type="hidden" name="party_a" value={JSON.stringify(partyA)} />
      <input type="hidden" name="party_b" value={JSON.stringify(partyB)} />
      <input type="hidden" name="additional_clauses" value="[]" />

      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Template Type */}
      <FormField label={t('templateType')} required>
        <select
          name="template_type"
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          defaultValue="construction_agreement"
        >
          <option value="construction_agreement">{t('constructionAgreement')}</option>
          <option value="supply_agreement">{t('supplyAgreement')}</option>
          <option value="custom">{t('custom')}</option>
        </select>
      </FormField>

      {/* Parties Preview */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4 space-y-2">
          <h3 className="font-semibold text-sm">{t('partyA')}</h3>
          <p className="text-xs text-muted-foreground">{partyA.company_name_ar || partyA.name}</p>
          {partyA.cr_number && <p className="text-xs text-muted-foreground">{t('crLabel', { value: partyA.cr_number })}</p>}
          {partyA.vat_number && <p className="text-xs text-muted-foreground">{t('vatLabel', { value: partyA.vat_number })}</p>}
        </div>
        <div className="rounded-lg border border-border p-4 space-y-2">
          <h3 className="font-semibold text-sm">{t('partyB')}</h3>
          {dealInfo ? (
            <>
              <p className="text-xs text-muted-foreground">{partyB.company_name_ar || partyB.name}</p>
              {partyB.cr_number && <p className="text-xs text-muted-foreground">{t('crLabel', { value: partyB.cr_number })}</p>}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">{t('partyBPending')}</p>
          )}
        </div>
      </div>

      {/* Scope */}
      <FormField
        label={t('scopeAr')}
        error={state?.error ? state.fieldErrors?.scope_ar?.[0] : undefined}
      >
        <Textarea name="scope_ar" rows={4} placeholder={t('scopeArPlaceholder')} />
      </FormField>

      <FormField label={t('scopeEn')}>
        <Textarea name="scope_en" rows={4} placeholder={t('scopeEnPlaceholder')} />
      </FormField>

      {/* Payment Terms */}
      <FormField label={t('paymentTermsAr')}>
        <Textarea name="payment_terms_ar" rows={3} placeholder={t('paymentTermsArPlaceholder')} />
      </FormField>

      <FormField label={t('paymentTermsEn')}>
        <Textarea name="payment_terms_en" rows={3} placeholder={t('paymentTermsEnPlaceholder')} />
      </FormField>

      {/* Timeline */}
      <FormField label={t('timeline')}>
        <Input name="timeline" placeholder={t('timelinePlaceholder')} />
      </FormField>

      {/* Penalties */}
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField label={t('penaltiesAr')}>
          <Textarea name="penalties_ar" rows={2} placeholder={t('penaltiesArPlaceholder')} />
        </FormField>
        <FormField label={t('penaltiesEn')}>
          <Textarea name="penalties_en" rows={2} placeholder={t('penaltiesEnPlaceholder')} />
        </FormField>
      </div>

      {/* Warranty */}
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField label={t('warrantyAr')}>
          <Textarea name="warranty_ar" rows={2} placeholder={t('warrantyArPlaceholder')} />
        </FormField>
        <FormField label={t('warrantyEn')}>
          <Textarea name="warranty_en" rows={2} placeholder={t('warrantyEnPlaceholder')} />
        </FormField>
      </div>

      {/* Governing Law */}
      <FormField label={t('governingLaw')}>
        <Input name="governing_law" defaultValue="Saudi Arabian Law" />
      </FormField>

      {/* Clause Library */}
      {clauses.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">{t('clauseLibrary', { count: clauses.length })}</h3>
          <p className="text-xs text-muted-foreground">{t('clauseLibraryHint')}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {clauses.map(clause => (
              <div key={clause.id as string} className="rounded-lg border border-border p-3 text-xs">
                <p className="font-medium">{clause.title_ar as string}</p>
                <p className="text-muted-foreground mt-1 line-clamp-2">{clause.content_ar as string}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3 justify-end">
        <Button type="submit" variant="primary" loading={isPending}>
          {t('createContract')}
        </Button>
      </div>
    </form>
  );
}
