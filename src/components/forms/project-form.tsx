'use client';

// =============================================================================
// Muqawil HUB — Project Form (Create/Edit)
// =============================================================================

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CitySelect } from '@/components/forms/city-select';
import { CurrencyInput } from '@/components/forms/currency-input';
import { createProject, updateProject } from '@/actions/projects';
import type { ActionResult } from '@/types';

interface ProjectFormProps {
  mode: 'create' | 'edit';
  defaultValues?: {
    project_id?: string;
    title_ar?: string;
    title_en?: string;
    description_ar?: string;
    description_en?: string;
    category_id?: string;
    city?: string;
    budget_min?: number;
    budget_max?: number;
    timeline_start?: string;
    timeline_end?: string;
    classification?: string;
    source?: string;
  };
}

export function ProjectForm({ mode, defaultValues }: ProjectFormProps) {
  const t = useTranslations('forms.project');
  const action = mode === 'create' ? createProject : updateProject;
  const [state, formAction, isPending] = useActionState<
    ActionResult<{ id: string; status?: string }> | null,
    FormData
  >(action as (state: ActionResult<{ id: string; status?: string }> | null, formData: FormData) => Promise<ActionResult<{ id: string; status?: string }>>, null);

  const getError = (field: string) =>
    state?.error ? state.fieldErrors?.[field]?.[0] : undefined;

  return (
    <form action={formAction} className="space-y-8">
      {/* Hidden fields */}
      {mode === 'edit' && defaultValues?.project_id && (
        <input type="hidden" name="project_id" value={defaultValues.project_id} />
      )}

      {/* Global error */}
      {state?.error && !state.fieldErrors && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </div>
      )}

      {/* Success */}
      {state?.data && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          {mode === 'create' ? t('createSuccess') : t('updateSuccess')}
        </div>
      )}

      {/* Section: Bilingual Content */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t('infoTitle')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="title_ar"
            label={t('titleAr')}
            defaultValue={defaultValues?.title_ar}
            error={getError('title_ar')}
            required
          />
          <Input
            name="title_en"
            label={t('titleEn')}
            defaultValue={defaultValues?.title_en}
            error={getError('title_en')}
            dir="ltr"
            required
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Textarea
            name="description_ar"
            label={t('descAr')}
            defaultValue={defaultValues?.description_ar}
            error={getError('description_ar')}
            rows={5}
            required
          />
          <Textarea
            name="description_en"
            label={t('descEn')}
            defaultValue={defaultValues?.description_en}
            error={getError('description_en')}
            dir="ltr"
            rows={5}
            required
          />
        </div>
      </section>

      {/* Section: Location & Classification */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t('locationTitle')}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <CitySelect
            name="city"
            label={t('city')}
            defaultValue={defaultValues?.city}
            error={getError('city')}
          />
          <div>
            <label htmlFor="source" className="mb-1.5 block text-sm font-medium text-foreground">
              {t('source')}
            </label>
            <select
              id="source"
              name="source"
              defaultValue={defaultValues?.source || 'owner'}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="owner">{t('sourceOwner')}</option>
              <option value="subcontract">{t('sourceSubcontract')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="classification" className="mb-1.5 block text-sm font-medium text-foreground">
              {t('classification')}
            </label>
            <select
              id="classification"
              name="classification"
              defaultValue={defaultValues?.classification || ''}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">{t('noClassification')}</option>
              <option value="a">{t('classA')}</option>
              <option value="b">{t('classB')}</option>
              <option value="c">{t('classC')}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section: Budget */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t('budgetTitle')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <CurrencyInput
            name="budget_min"
            label={t('budgetMin')}
            defaultValue={defaultValues?.budget_min}
            error={getError('budget_min')}
          />
          <CurrencyInput
            name="budget_max"
            label={t('budgetMax')}
            defaultValue={defaultValues?.budget_max}
            error={getError('budget_max')}
          />
        </div>
      </section>

      {/* Section: Timeline */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t('timelineTitle')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="date"
            name="timeline_start"
            label={t('startDate')}
            defaultValue={defaultValues?.timeline_start}
            error={getError('timeline_start')}
          />
          <Input
            type="date"
            name="timeline_end"
            label={t('endDate')}
            defaultValue={defaultValues?.timeline_end}
            error={getError('timeline_end')}
          />
        </div>
      </section>

      {/* TODO: File upload section for BOQ, drawings, specs (Phase 3 - Task #109) */}

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>
          {mode === 'create' ? t('createProject') : t('saveChanges')}
        </Button>
      </div>
    </form>
  );
}
