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
import { DatePicker } from '@/components/ui/date-picker';
import { createProject, updateProject, removeProjectFile } from '@/actions/projects';
import { adminUpdateProject } from '@/actions/admin/moderation';
import { AlertBanner } from '@/components/ui/alert-banner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, FileText, LinkIcon, ImagePlus } from 'lucide-react';
import { getProxyUrl } from '@/lib/file-utils';
import type { ActionResult } from '@/types';

interface ExistingFile {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  category: string;
  mime_type?: string;
}

interface ExistingImage {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
}

interface ProjectFormProps {
  mode: 'create' | 'edit' | 'admin';
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
    external_link?: string;
    status?: string;
    existingFiles?: ExistingFile[];
    existingImages?: ExistingImage[];
  };
}

export function ProjectForm({ mode, defaultValues }: ProjectFormProps) {
  const t = useTranslations('forms.project');
  const tFiles = useTranslations('forms.project.files');
  const action = mode === 'admin' ? adminUpdateProject : mode === 'create' ? createProject : updateProject;
  const [state, formAction, isPending] = useActionState<
    ActionResult<{ id: string; status?: string }> | null,
    FormData
  >(action as (state: ActionResult<{ id: string; status?: string }> | null, formData: FormData) => Promise<ActionResult<{ id: string; status?: string }>>, null);

  const [projectFiles, setProjectFiles] = useState<File[]>([]);
  const [projectImages, setProjectImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [fileCategory, setFileCategory] = useState('general');
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>(defaultValues?.existingFiles ?? []);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(defaultValues?.existingImages ?? []);
  const [isRemoving, startRemoveTransition] = useTransition();

  const handleImageUpload = (files: File[]) => {
    setProjectImages(files);
    // Generate previews
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return previews;
    });
  };

  const removeNewImage = (index: number) => {
    setProjectImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      handleImageUpload(updated);
      return updated;
    });
  };

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
        // Append images separately
        projectImages.forEach((file) => {
          formData.append('project_images', file);
        });
        formAction(formData);
      }}
      className="space-y-8"
    >
      {/* Hidden fields */}
      {(mode === 'edit' || mode === 'admin') && defaultValues?.project_id && (
        <input type="hidden" name="project_id" value={defaultValues.project_id} />
      )}

      {/* Admin: Status control */}
      {mode === 'admin' && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">{t('statusTitle')}</h2>
          <Select name="status" defaultValue={defaultValues?.status || 'draft'}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">{t('statusDraft')}</SelectItem>
              <SelectItem value="pending">{t('statusPending')}</SelectItem>
              <SelectItem value="published">{t('statusPublished')}</SelectItem>
              <SelectItem value="rejected">{t('statusRejected')}</SelectItem>
            </SelectContent>
          </Select>
        </section>
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
          showBothLanguages={mode === 'admin'}
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
            showBothLanguages={mode === 'admin'}
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

      {/* Section: External Link */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t('externalLinkTitle')}</h2>
        <div className="relative">
          <Input
            type="url"
            name="external_link"
            label={t('externalLink')}
            placeholder="https://example.com/project-details"
            defaultValue={defaultValues?.external_link}
            error={getError('external_link')}
            hint={t('externalLinkHint')}
          />
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
          <DatePicker
            name="timeline_start"
            label={t('startDate')}
            defaultValue={defaultValues?.timeline_start}
            error={getError('timeline_start')}
          />
          <DatePicker
            name="timeline_end"
            label={t('endDate')}
            defaultValue={defaultValues?.timeline_end}
            error={getError('timeline_end')}
          />
        </div>
      </section>

      {/* Section: Project Images */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-foreground">{t('imagesTitle')}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{t('imagesHint')}</p>

        {/* Existing images (edit/admin mode) */}
        {(mode === 'edit' || mode === 'admin') && existingImages.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-foreground">{t('existingImages')}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {existingImages.map((img) => (
                <div key={img.id} className="group relative overflow-hidden rounded-lg border">
                  <img
                    src={getProxyUrl(img.file_url)}
                    alt={img.file_name}
                    className="aspect-video w-full object-cover"
                  />
                  <button
                    type="button"
                    disabled={isRemoving}
                    onClick={() => {
                      if (!defaultValues?.project_id) return;
                      startRemoveTransition(async () => {
                        await removeProjectFile(defaultValues.project_id!, img.id);
                        setExistingImages((prev) => prev.filter((f) => f.id !== img.id));
                      });
                    }}
                    className="absolute end-1 top-1 rounded-full bg-destructive/80 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New image previews */}
        {imagePreviews.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {imagePreviews.map((url, index) => (
                <div key={url} className="group relative overflow-hidden rounded-lg border">
                  <img
                    src={url}
                    alt={projectImages[index]?.name ?? ''}
                    className="aspect-video w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute end-1 top-1 rounded-full bg-destructive/80 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <FileUpload
          name="project_images_input"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          maxSize={50}
          maxFiles={10}
          hint={t('imagesFileLimit')}
          onUpload={handleImageUpload}
        />
      </section>

      {/* Section: Documents & Files */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-foreground">{tFiles('title')}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{tFiles('hint')}</p>

        {/* Existing files (edit/admin mode) */}
        {(mode === 'edit' || mode === 'admin') && existingFiles.length > 0 && (
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
                    href={getProxyUrl(file.file_url)}
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
          maxSize={50}
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
