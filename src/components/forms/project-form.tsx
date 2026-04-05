'use client';

// =============================================================================
// Muhandes HUB — Project Form (Create/Edit)
// =============================================================================

import { useActionState, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BilingualFieldPair } from '@/components/ui/bilingual-field-pair';
import { CitySelect } from '@/components/forms/city-select';
import { CurrencyInput } from '@/components/forms/currency-input';
import { FileUpload } from '@/components/forms/file-upload';
import { createProject, updateProject, removeProjectFile } from '@/actions/projects';
import { AlertBanner } from '@/components/ui/alert-banner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, FileText } from 'lucide-react';
import type { ActionResult } from '@/types';

interface ExistingFile {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  category: string;
  mime_type?: string;
}

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
    existingFiles?: ExistingFile[];
  };
}

export function ProjectForm({ mode, defaultValues }: ProjectFormProps) {
  const t = useTranslations('forms.project');
  const tFiles = useTranslations('forms.project.files');
  const action = mode === 'create' ? createProject : updateProject;
  const [state, formAction, isPending] = useActionState<
    ActionResult<{ id: string; status?: string }> | null,
    FormData
  >(action as (state: ActionResult<{ id: string; status?: string }> | null, formData: FormData) => Promise<ActionResult<{ id: string; status?: string }>>, null);

  const [projectFiles, setProjectFiles] = useState<File[]>([]);
  const [fileCategory, setFileCategory] = useState('general');
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>(defaultValues?.existingFiles ?? []);
  const [isRemoving, startRemoveTransition] = useTransition();

  const getError = (field: string) =>
    state?.error ? state.fieldErrors?.[field]?.[0] : undefined;

  return (
    <form
      action={(formData) => {
        // Append files with their category
        projectFiles.forEach((file) => {
          formData.append('project_files', file);
        });
        if (projectFiles.length > 0) {
          formData.set('file_category', fileCategory);
        }
        formAction(formData);
      }}
      className="space-y-8"
    >
      {/* Hidden fields */}
      {mode === 'edit' && defaultValues?.project_id && (
        <input type="hidden" name="project_id" value={defaultValues.project_id} />
      )}

      {/* Global error */}
      {state?.error && !state.fieldErrors && (
        <AlertBanner variant="error">{state.error}</AlertBanner>
      )}

      {/* Success */}
      {state?.data && (
        <AlertBanner variant="success">{mode === 'create' ? t('createSuccess') : t('updateSuccess')}</AlertBanner>
      )}

      {/* Section: Bilingual Content */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t('infoTitle')}</h2>
        <BilingualFieldPair
          baseName="title"
          labelAr={t('titleAr')}
          labelEn={t('titleEn')}
          defaultValueAr={defaultValues?.title_ar}
          defaultValueEn={defaultValues?.title_en}
          errorAr={getError('title_ar')}
          errorEn={getError('title_en')}
          required
        />
        <div className="mt-4">
          <BilingualFieldPair
            baseName="description"
            type="textarea"
            rows={5}
            labelAr={t('descAr')}
            labelEn={t('descEn')}
            defaultValueAr={defaultValues?.description_ar}
            defaultValueEn={defaultValues?.description_en}
            errorAr={getError('description_ar')}
            errorEn={getError('description_en')}
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
            <Select name="source" defaultValue={defaultValues?.source || 'owner'}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">{t('sourceOwner')}</SelectItem>
                <SelectItem value="subcontract">{t('sourceSubcontract')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="classification" className="mb-1.5 block text-sm font-medium text-foreground">
              {t('classification')}
            </label>
            <Select name="classification" defaultValue={defaultValues?.classification || ''}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('noClassification')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('noClassification')}</SelectItem>
                <SelectItem value="a">{t('classA')}</SelectItem>
                <SelectItem value="b">{t('classB')}</SelectItem>
                <SelectItem value="c">{t('classC')}</SelectItem>
              </SelectContent>
            </Select>
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

      {/* Section: Documents & Files */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-foreground">{tFiles('title')}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{tFiles('hint')}</p>

        {/* Existing files (edit mode) */}
        {mode === 'edit' && existingFiles.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-foreground">{tFiles('existingFiles')}</p>
            <ul className="space-y-2">
              {existingFiles.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center gap-2 rounded-lg border p-2 text-sm"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize text-muted-foreground">
                    {tFiles(file.category as 'boq' | 'drawings' | 'images' | 'specs' | 'general')}
                  </span>
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 truncate text-primary underline-offset-2 hover:underline"
                  >
                    {file.file_name}
                  </a>
                  <span className="text-xs text-muted-foreground">
                    {(file.file_size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    type="button"
                    disabled={isRemoving}
                    onClick={() => {
                      if (!defaultValues?.project_id) return;
                      startRemoveTransition(async () => {
                        await removeProjectFile(defaultValues.project_id!, file.id);
                        setExistingFiles((prev) => prev.filter((f) => f.id !== file.id));
                      });
                    }}
                    className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Category selector */}
        <div className="mb-3">
          <label htmlFor="file_category" className="mb-1.5 block text-sm font-medium text-foreground">
            {tFiles('category')}
          </label>
          <Select value={fileCategory} onValueChange={(v) => setFileCategory(v ?? '')}>
            <SelectTrigger className="w-full sm:w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">{tFiles('general')}</SelectItem>
              <SelectItem value="boq">{tFiles('boq')}</SelectItem>
              <SelectItem value="drawings">{tFiles('drawings')}</SelectItem>
              <SelectItem value="images">{tFiles('images')}</SelectItem>
              <SelectItem value="specs">{tFiles('specs')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <FileUpload
          name="project_files_input"
          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp"
          multiple
          maxSize={10}
          maxFiles={10}
          hint={tFiles('fileLimit')}
          onUpload={setProjectFiles}
        />
      </section>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>
          {mode === 'create' ? t('createProject') : t('saveChanges')}
        </Button>
      </div>
    </form>
  );
}
