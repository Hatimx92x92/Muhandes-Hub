// =============================================================================
// CRM Add Client Form — Client Component (Modal-style inline form)
// =============================================================================

'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms/form-field';
import { addClient } from '@/actions/crm';
import type { ActionResult } from '@/types';

interface Props {
  tags: Array<Record<string, unknown>>;
}

type State = ActionResult<{ id: string }> | null;

export function CrmAddClientForm({ tags }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<State, FormData>(addClient, null);
  const t = useTranslations('features.crmAddClient');

  if (!open) {
    return (
      <Button variant="primary" onClick={() => setOpen(true)}>
        {t('addClient')}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-card border border-border p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{t('title')}</h2>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        {state?.error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <FormField
            label={t('name')}
            error={state?.error ? state.fieldErrors?.name?.[0] : undefined}
            required
          >
            <Input name="name" placeholder={t('namePlaceholder')} />
          </FormField>

          <FormField label={t('phone')}>
            <Input name="phone" placeholder="+966500000000" dir="ltr" />
          </FormField>

          <FormField label={t('email')}>
            <Input name="email" type="email" placeholder="client@example.com" dir="ltr" />
          </FormField>

          <FormField label={t('company')}>
            <Input name="company" placeholder={t('companyPlaceholder')} />
          </FormField>

          <FormField label={t('source')}>
            <select
              name="source"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              defaultValue="manual_entry"
            >
              <option value="manual_entry">{t('sources.manual_entry')}</option>
              <option value="bid_award">{t('sources.bid_award')}</option>
              <option value="product_inquiry">{t('sources.product_inquiry')}</option>
              <option value="rfq_response">{t('sources.rfq_response')}</option>
              <option value="direct_hire">{t('sources.direct_hire')}</option>
            </select>
          </FormField>

          <FormField label={t('pipelineStage')}>
            <select
              name="pipeline_stage"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              defaultValue="lead"
            >
              <option value="lead">{t('stages.lead')}</option>
              <option value="in_negotiation">{t('stages.in_negotiation')}</option>
              <option value="active_deal">{t('stages.active_deal')}</option>
              <option value="completed">{t('stages.completed')}</option>
              <option value="repeat">{t('stages.repeat')}</option>
            </select>
          </FormField>

          {tags.length > 0 && (
            <FormField label={t('tags')}>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <label key={tag.id as string} className="flex items-center gap-1 text-xs">
                    <input type="checkbox" name="tags" value={tag.id as string} className="rounded" />
                    <span
                      className="inline-block rounded-full px-2 py-0.5"
                      style={{ backgroundColor: `${tag.color as string}20`, color: tag.color as string }}
                    >
                      {tag.name as string}
                    </span>
                  </label>
                ))}
              </div>
            </FormField>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={isPending}>
              {t('add')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
