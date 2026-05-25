// =============================================================================
// Dashboard — Edit Project Page
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { ProjectForm } from '@/components/forms/project-form';
import { ModerationFeedback } from '@/components/features/moderation-feedback';
import { PageHeader } from '@/components/ui/page-header';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getLocaleField, isUUID, getEntitySlug } from '@/lib/utils';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';
import { SAUDI_CITIES } from '@/components/forms/city-select';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug: rawSlug } = await params;
  setRequestLocale(locale);
  let slug: string;
  try { slug = decodeURIComponent(rawSlug); } catch { slug = rawSlug; }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let project;
  const projectSelect = '*, saudi_cities(name_en)';

  if (isUUID(slug)) {
    const { data } = await db(supabase).from('projects').select('slug_ar, slug_en').eq('id', slug).single();
    if (data) {
      const targetSlug = getEntitySlug(data, locale);
      if (targetSlug) redirect(`/dashboard/projects/${targetSlug}/edit`);
    }
    notFound();
  }

  const slugCol = locale === 'ar' ? 'slug_ar' : 'slug_en';
  ({ data: project } = await db(supabase).from('projects').select(projectSelect).eq(slugCol, slug).eq('owner_id', user.id).single());
  if (!project) {
    const fallbackCol = locale === 'ar' ? 'slug_en' : 'slug_ar';
    ({ data: project } = await db(supabase).from('projects').select(projectSelect).eq(fallbackCol, slug).eq('owner_id', user.id).single());
  }
  if (!project) notFound();

  const id = project.id;

  // Can only edit draft or rejected projects
  if (!['draft', 'rejected'].includes(project.status)) {
    redirect(`/dashboard/projects/${slug}`);
  }

  // Fetch project files for editing
  const { data: projectFiles } = await db(supabase)
    .from('project_files')
    .select('id, file_url, file_name, file_size, mime_type, category')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  const t = await getTranslations('dashboard.projects.detail');

  return (
    <div className="space-y-6">
      <BreadcrumbOverride segment={slug} label={getLocaleField(project, 'title', locale)} />
      <PageHeader title={t('editProject')} description={t('editProjectDesc')} backHref={`/dashboard/projects/${slug}`} />

      {/* Rejection feedback if re-editing after rejection */}
      {project.status === 'rejected' && (
        <ModerationFeedback
          rejectionReasonAr={project.rejection_reason_ar}
          rejectionReasonEn={project.rejection_reason_en}
        />
      )}

      <Card className="p-6">
        <ProjectForm
          mode="edit"
          defaultValues={{
            project_id: project.id,
            title_ar: project.title_ar,
            title_en: project.title_en,
            description_ar: project.description_ar,
            description_en: project.description_en,
            category_id: project.category_id ?? undefined,
            city: SAUDI_CITIES.find(c => c.label_en.toLowerCase() === project.saudi_cities?.name_en?.toLowerCase())?.value ?? undefined,
            budget_min: project.budget_min ?? undefined,
            budget_max: project.budget_max ?? undefined,
            timeline_start: project.timeline_start ?? undefined,
            timeline_end: project.timeline_end ?? undefined,
            classification: project.classification ?? undefined,
            source: project.source ?? 'owner',
            existingFiles: (projectFiles ?? []).filter((f: { category: string }) => f.category !== 'images'),
            existingImages: (projectFiles ?? []).filter((f: { category: string }) => f.category === 'images'),
          }}
        />
      </Card>
    </div>
  );
}
