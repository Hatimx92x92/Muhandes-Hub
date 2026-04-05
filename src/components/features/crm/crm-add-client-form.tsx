// =============================================================================
// CRM Add Client Form — Client Component (Modal-style inline form)
// =============================================================================

'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms/form-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { addClient } from '@/actions/crm';
import type { ActionResult } from '@/types';

interface Props {
  tags: Array<Record<string, unknown>>;
}

type State = ActionResult<{ id: string }> | null;

export function CrmAddClientForm({ tags }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<State, FormData>(addClient, null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const t = useTranslations('features.crmAddClient');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="primary" />}>
        {t('addClient')}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

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
            <Select name="source" defaultValue="manual_entry">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual_entry">{t('sources.manual_entry')}</SelectItem>
                <SelectItem value="bid_award">{t('sources.bid_award')}</SelectItem>
                <SelectItem value="product_inquiry">{t('sources.product_inquiry')}</SelectItem>
                <SelectItem value="rfq_response">{t('sources.rfq_response')}</SelectItem>
                <SelectItem value="direct_hire">{t('sources.direct_hire')}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={t('pipelineStage')}>
            <Select name="pipeline_stage" defaultValue="lead">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">{t('stages.lead')}</SelectItem>
                <SelectItem value="in_negotiation">{t('stages.in_negotiation')}</SelectItem>
                <SelectItem value="active_deal">{t('stages.active_deal')}</SelectItem>
                <SelectItem value="completed">{t('stages.completed')}</SelectItem>
                <SelectItem value="repeat">{t('stages.repeat')}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {tags.length > 0 && (
            <FormField label={t('tags')}>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <label key={tag.id as string} className="flex items-center gap-1 text-xs">
                    <Checkbox
                      name="tags"
                      value={tag.id as string}
                      checked={selectedTags.includes(tag.id as string)}
                      onCheckedChange={(v) => {
                        const id = tag.id as string;
                        setSelectedTags(prev => v ? [...prev, id] : prev.filter(t => t !== id));
                      }}
                    />
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

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={isPending}>
              {t('add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
