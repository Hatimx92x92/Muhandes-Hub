// =============================================================================
// Dashboard — Edit Project Page
// =============================================================================

import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { ProjectForm } from '@/components/forms/project-form';
import { ModerationFeedback } from '@/components/features/moderation-feedback';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: project } = await db(supabase)
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (!project) notFound();

  // Ownership check
  if (project.owner_id !== user.id) {
    redirect('/dashboard/projects');
  }

  // Can only edit draft or rejected projects
  if (!['draft', 'rejected'].includes(project.status)) {
    redirect(`/dashboard/projects/${id}`);
  }

  const t = await getTranslations('dashboard.projects.detail');

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/projects/${id}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          {t('backToProject')}
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{t('editProject')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('editProjectDesc')}
        </p>
      </div>

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
            city: project.city ?? undefined,
            budget_min: project.budget_min ?? undefined,
            budget_max: project.budget_max ?? undefined,
            timeline_start: project.timeline_start ?? undefined,
            timeline_end: project.timeline_end ?? undefined,
            classification: project.classification ?? undefined,
            source: project.source ?? 'owner',
          }}
        />
      </Card>
    </div>
  );
}
