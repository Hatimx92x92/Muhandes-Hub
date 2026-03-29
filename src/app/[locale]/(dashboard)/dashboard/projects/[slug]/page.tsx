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
import { formatSAR, formatDate, getLocaleField, isUUID, getEntitySlug } from '@/lib/utils';
import { Pencil, Send, Trash2, MapPin, Calendar, Banknote, Users, Handshake, ChevronRight } from 'lucide-react';
import { submitProjectForApproval, deleteProject } from '@/actions/projects';
import { getTranslations, getLocale } from 'next-intl/server';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';
import { FileDisplayList } from '@/components/features/file-display-list';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const locale = await getLocale();

  let project;
  if (isUUID(slug)) {
    const { data } = await db(supabase).from('projects').select('*').eq('id', slug).single();
    if (data) {
      const targetSlug = getEntitySlug(data, locale);
      if (targetSlug) redirect(`/dashboard/projects/${targetSlug}`);
    }
    notFound();
  }

  const slugCol = locale === 'ar' ? 'slug_ar' : 'slug_en';
  ({ data: project } = await db(supabase).from('projects').select('*').eq(slugCol, slug).eq('owner_id', user.id).single());
  if (!project) {
    const fallbackCol = locale === 'ar' ? 'slug_en' : 'slug_ar';
    ({ data: project } = await db(supabase).from('projects').select('*').eq(fallbackCol, slug).eq('owner_id', user.id).single());
  }
  if (!project) notFound();

  const id = project.id;

  const t = await getTranslations('dashboard.projects.detail');
  const tCommon = await getTranslations('dashboard.common');

  // Fetch project files
  const { data: projectFiles } = await db(supabase)
    .from('project_files')
    .select('id, file_url, file_name, file_size, mime_type, category, created_at')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false });

  // Fetch associated deals
  const { data: projectDeals } = await db(supabase)
    .from('deals')
    .select('id, title_slug, status, value, trigger_source, created_at, profiles:seller_id(full_name)')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const validStatuses = ['draft', 'pending', 'published', 'rejected', 'awarded', 'completed', 'expired', 'closed'] as const;
  const status = validStatuses.includes(project.status) ? project.status : 'draft';
  const canEdit = ['draft', 'rejected'].includes(status);
  const canSubmit = ['draft', 'rejected'].includes(status);
  const canDelete = status === 'draft' && project.bid_count === 0;

  return (
    <div className="space-y-6">
      <BreadcrumbOverride segment={slug} label={getLocaleField(project, 'title', locale)} />
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
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
          {/* Description */}
          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">{tCommon('description')}</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {getLocaleField(project, 'description', locale)}
            </p>
          </Card>

          {projectFiles && projectFiles.length > 0 && (
            <FileDisplayList files={projectFiles} title={t('documentsAndFiles')} />
          )}

          {/* Associated Deals */}
          {projectDeals && projectDeals.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
                <Handshake className="h-5 w-5 text-primary" />
                {t('associatedDeals')}
              </h2>
              <div className="space-y-2">
                {projectDeals.map((deal: { id: string; title_slug: string | null; status: string; value: number; trigger_source: string; created_at: string; profiles: { full_name: string } | null }) => (
                  <Link
                    key={deal.id}
                    href={`/dashboard/deals/${deal.title_slug || deal.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-primary block truncate">
                        {deal.title_slug || `#${deal.id.slice(0, 8)}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {deal.profiles?.full_name} · {formatSAR(deal.value)} · {formatDate(deal.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={deal.status === 'completed' ? 'success' : deal.status === 'cancelled' ? 'destructive' : 'info'} className="text-[10px]">
                        {deal.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
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
