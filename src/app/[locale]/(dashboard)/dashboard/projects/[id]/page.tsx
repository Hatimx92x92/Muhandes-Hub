// =============================================================================
// Dashboard — Project Detail Page
// =============================================================================

import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PostStatusBadge } from '@/components/features/post-status-badge';
import { ModerationFeedback } from '@/components/features/moderation-feedback';
import { formatSAR, formatDate, getLocaleField } from '@/lib/utils';
import { Pencil, Send, Trash2, MapPin, Calendar, Banknote, Users, ArrowRight } from 'lucide-react';
import { submitProjectForApproval, deleteProject } from '@/actions/projects';
import { getTranslations, getLocale } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function ProjectDetailPage({
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

  const t = await getTranslations('dashboard.projects.detail');
  const tCommon = await getTranslations('dashboard.common');
  const locale = await getLocale();

  const validStatuses = ['draft', 'pending', 'published', 'rejected', 'awarded', 'completed', 'expired', 'closed'] as const;
  const status = validStatuses.includes(project.status) ? project.status : 'draft';
  const canEdit = ['draft', 'rejected'].includes(status);
  const canSubmit = ['draft', 'rejected'].includes(status);
  const canDelete = status === 'draft' && project.bid_count === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/projects"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            {t('backToProjects')}
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {getLocaleField(project, 'title', locale)}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <PostStatusBadge status={status} />
            {project.source === 'subcontract' && (
              <Badge variant="info">{tCommon('subcontract')}</Badge>
            )}
            {project.classification && (
              <Badge variant="outline">{tCommon('category')} {project.classification.toUpperCase()}</Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {canEdit && (
            <Link href={`/dashboard/projects/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="me-1.5 h-4 w-4" />
                {tCommon('edit')}
              </Button>
            </Link>
          )}
          {canSubmit && (
            <form action={async () => {
              'use server';
              await submitProjectForApproval(id);
            }}>
              <Button size="sm">
                <Send className="me-1.5 h-4 w-4" />
                {t('submitForReview')}
              </Button>
            </form>
          )}
          {canDelete && (
            <form action={async () => {
              'use server';
              await deleteProject(id);
              redirect('/dashboard/projects');
            }}>
              <Button variant="destructive" size="sm">
                <Trash2 className="me-1.5 h-4 w-4" />
                {tCommon('delete')}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Rejection Feedback */}
      {status === 'rejected' && (
        <ModerationFeedback
          rejectionReasonAr={project.rejection_reason_ar}
          rejectionReasonEn={project.rejection_reason_en}
        />
      )}

      {/* Details Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Arabic Description */}
          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">{tCommon('descriptionAr')}</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {project.description_ar}
            </p>
          </Card>

          {/* English Description */}
          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">{tCommon('descriptionEn')}</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground" dir="ltr">
              {project.description_en}
            </p>
          </Card>

          {/* English Title */}
          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">{tCommon('titleEn')}</h2>
            <p className="text-sm text-muted-foreground" dir="ltr">{project.title_en}</p>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Meta Info */}
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t('projectDetails')}</h3>
            <dl className="space-y-3 text-sm">
              {project.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <dt className="text-muted-foreground">{tCommon('city')}:</dt>
                  <dd className="font-medium text-foreground">{project.city}</dd>
                </div>
              )}
              {(project.budget_min || project.budget_max) && (
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                  <dt className="text-muted-foreground">{tCommon('budget')}:</dt>
                  <dd className="font-medium text-foreground">
                    {project.budget_min && project.budget_max
                      ? `${formatSAR(project.budget_min)} - ${formatSAR(project.budget_max)}`
                      : project.budget_max
                        ? `${tCommon('upTo')} ${formatSAR(project.budget_max)}`
                        : `${tCommon('from')} ${formatSAR(project.budget_min)}`}
                  </dd>
                </div>
              )}
              {project.timeline_start && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <dt className="text-muted-foreground">{tCommon('duration')}:</dt>
                  <dd className="font-medium text-foreground">
                    {formatDate(project.timeline_start)}
                    {project.timeline_end && ` — ${formatDate(project.timeline_end)}`}
                  </dd>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <dt className="text-muted-foreground">{tCommon('bids')}:</dt>
                <dd className="font-medium text-foreground">{project.bid_count ?? 0}</dd>
              </div>
            </dl>
          </Card>

          {/* Timestamps */}
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">{tCommon('dates')}</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">{tCommon('createdAt')}</dt>
                <dd className="font-medium text-foreground">{formatDate(project.created_at)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{tCommon('updatedAt')}</dt>
                <dd className="font-medium text-foreground">{formatDate(project.updated_at)}</dd>
              </div>
              {project.approved_at && (
                <div>
                  <dt className="text-muted-foreground">{tCommon('approvalDate')}</dt>
                  <dd className="font-medium text-foreground">{formatDate(project.approved_at)}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
