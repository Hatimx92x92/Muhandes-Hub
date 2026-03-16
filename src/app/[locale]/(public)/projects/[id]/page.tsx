// =============================================================================
// Public — Project Detail Page
// =============================================================================

import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatSAR, formatDate, getLocaleField } from '@/lib/utils';
import { MapPin, Banknote, Calendar, Users, ArrowRight, Building2, Shield } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function PublicProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const t = await getTranslations('public.projectDetail');
  const locale = await getLocale();

  const { data: project } = await db(supabase)
    .from('projects')
    .select('id, title_ar, title_en, description_ar, description_en, city, budget_min, budget_max, source, classification, bid_count, created_at, timeline_start, timeline_end, owner_id')
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (!project) notFound();

  const { data: owner } = await db(supabase)
    .from('profiles')
    .select('full_name, company_name_ar, company_name_en, avatar_url, subscription_tier')
    .eq('id', project.owner_id)
    .single();

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        {t('backToProjects')}
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {getLocaleField(project, 'title', locale)}
            </h1>
            <p className="mt-1 text-base text-muted-foreground" dir="ltr">
              {project.title_en}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.source === 'subcontract' && (
                <Badge variant="info">{t('subcontract')}</Badge>
              )}
              {project.classification && (
                <Badge variant="outline">{t('category')} {project.classification.toUpperCase()}</Badge>
              )}
              <Badge variant="published">{t('published')}</Badge>
            </div>
          </div>

          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t('projectDescription')}</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {project.description_ar}
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t('projectDescriptionEn')}</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground" dir="ltr">
              {project.description_en}
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-4 text-center">
              <div className="text-3xl font-bold text-foreground">{project.bid_count}</div>
              <div className="text-sm text-muted-foreground">{t('bidCount', { count: project.bid_count })}</div>
            </div>
            {user ? (
              <Link href={`/dashboard/projects/${project.id}/bid`} className="block">
                <Button className="w-full">{t('submitBid')}</Button>
              </Link>
            ) : (
              <Link href="/login" className="block">
                <Button className="w-full" variant="outline">
                  {t('loginToSubmitBid')}
                </Button>
              </Link>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t('projectDetails')}</h3>
            <dl className="space-y-3 text-sm">
              {project.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <dt className="text-muted-foreground">{t('city')}:</dt>
                  <dd className="font-medium text-foreground">{project.city}</dd>
                </div>
              )}
              {(project.budget_min || project.budget_max) && (
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                  <dt className="text-muted-foreground">{t('budget')}:</dt>
                  <dd className="font-medium text-foreground">
                    {project.budget_min && project.budget_max
                      ? `${formatSAR(project.budget_min)} - ${formatSAR(project.budget_max)}`
                      : project.budget_max
                        ? t('budgetUpTo', { amount: formatSAR(project.budget_max) })
                        : t('budgetFrom', { amount: formatSAR(project.budget_min) })}
                  </dd>
                </div>
              )}
              {project.timeline_start && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <dt className="text-muted-foreground">{t('timeline')}:</dt>
                  <dd className="font-medium text-foreground">
                    {formatDate(project.timeline_start)}
                    {project.timeline_end && ` — ${formatDate(project.timeline_end)}`}
                  </dd>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <dt className="text-muted-foreground">{t('bids')}:</dt>
                <dd className="font-medium text-foreground">{project.bid_count ?? 0}</dd>
              </div>
            </dl>
          </Card>

          {owner && (
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{t('projectOwner')}</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  {owner.avatar_url ? (
                    <img src={owner.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <Building2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {locale === 'ar'
                      ? (owner.company_name_ar || owner.full_name || t('defaultOwner'))
                      : (owner.company_name_en || owner.company_name_ar || owner.full_name || t('defaultOwner'))}
                  </p>
                  {owner.subscription_tier && (
                    <Badge
                      variant={owner.subscription_tier as 'starter' | 'pro' | 'business' | 'enterprise'}
                      className="mt-1"
                    >
                      <Shield className="me-1 h-3 w-3" />
                      {owner.subscription_tier}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          )}

          <Card className="p-5">
            <div className="text-sm text-muted-foreground">
              {t('publishedAt', { date: formatDate(project.created_at) })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
