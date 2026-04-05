// =============================================================================
// Daily Log Form — Client Component
// =============================================================================

'use client';

import { useActionState, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/forms/form-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/forms/file-upload';
import { createDailyLog } from '@/actions/kanban';
import type { ActionResult } from '@/types';

type State = ActionResult<{ id: string }> | null;

export function DailyLogForm({ dealId }: { dealId: string }) {
  const [state, formAction, isPending] = useActionState<State, FormData>(createDailyLog, null);
  const t = useTranslations('features.dailyLog');
  const [photos, setPhotos] = useState<File[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = useCallback((formData: FormData) => {
    // Append photo files to form data
    for (const photo of photos) {
      formData.append('photos', photo);
    }
    formAction(formData);
  }, [photos, formAction]);

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <input type="hidden" name="deal_id" value={dealId} />
      <input type="hidden" name="log_date" value={today} />

      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('weather')}>
          <Select name="weather" defaultValue="">
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('weatherOptional')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sunny">{t('weatherSunny')}</SelectItem>
              <SelectItem value="cloudy">{t('weatherCloudy')}</SelectItem>
              <SelectItem value="rainy">{t('weatherRainy')}</SelectItem>
              <SelectItem value="windy">{t('weatherWindy')}</SelectItem>
              <SelectItem value="sandstorm">{t('weatherSandstorm')}</SelectItem>
              <SelectItem value="hot">{t('weatherHot')}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label={t('workersOnSite')}>
          <Input name="workers_on_site" type="number" min="0" placeholder="0" />
        </FormField>
      </div>

      <FormField
        label={t('workCompletedAr')}
        error={state?.error ? state.fieldErrors?.description_ar?.[0] : undefined}
        required
      >
        <Textarea name="description_ar" rows={4} placeholder={t('workCompletedArPlaceholder')} />
      </FormField>

      <FormField label={t('workCompletedEn')}>
        <Textarea name="description_en" rows={3} placeholder={t('workCompletedEnPlaceholder')} />
      </FormField>

      <FormField label={t('issues')}>
        <Textarea name="issues" rows={2} placeholder={t('issuesPlaceholder')} />
      </FormField>

      <FormField label={t('safetyNotes')}>
        <Textarea name="safety_notes" rows={2} placeholder={t('safetyNotesPlaceholder')} />
      </FormField>

      <FormField label={t('photos')}>
        <FileUpload
          name="photos"
          accept="image/jpeg,image/png,image/webp"
          multiple
          maxSize={5}
          maxFiles={10}
          hint={t('photosHint')}
          onUpload={setPhotos}
        />
      </FormField>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={isPending}>
          {t('save')}
        </Button>
      </div>
    </form>
  );
}
