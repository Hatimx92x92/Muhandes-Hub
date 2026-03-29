// =============================================================================
// Public — Project Detail Page
// =============================================================================

import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatSAR, formatDate, getLocaleField, isUUID, getEntitySlug } from '@/lib/utils';
import { MapPin, Banknote, Calendar, Users, Building2, Shield, FolderOpen, Pencil } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';
import { FileDisplayList } from '@/components/features/file-display-list';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function PublicProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const t = await getTranslations('public.projectDetail');
  const locale = await getLocale();

  // UUID redirect: old ID-based URLs → slug-based
  if (isUUID(slug)) {
    const { data: record } = await db(supabase)
      .from('projects')
      .select('slug_ar, slug_en')
      .eq('id', slug)
      .single();
    if (record) {
      const targetSlug = getEntitySlug(record, locale);
      if (targetSlug) redirect(`/projects/${targetSlug}`);
    }
    notFound();
  }

  // Fetch by locale-appropriate slug with cross-locale fallback
  const slugCol = locale === 'ar' ? 'slug_ar' : 'slug_en';
  let { data: project } = await db(supabase)
    .from('projects')
    .select('id, title_ar, title_en, description_ar, description_en, city_id, budget_min, budget_max, source, classification, bid_count, created_at, timeline_start, timeline_end, owner_id, slug_ar, slug_en')
    .eq(slugCol, slug)
    .eq('status', 'published')
    .single();

  if (!project) {
    const fallbackCol = locale === 'ar' ? 'slug_en' : 'slug_ar';
    ({ data: project } = await db(supabase)
      .from('projects')
      .select('id, title_ar, title_en, description_ar, description_en, city_id, budget_min, budget_max, source, classification, bid_count, created_at, timeline_start, timeline_end, owner_id, slug_ar, slug_en')
      .eq(fallbackCol, slug)
      .eq('status', 'published')
      .single());
  }

  if (!project) notFound();

  const { data: owner } = await db(supabase)
    .from('profiles')
    .select('full_name, company_name_ar, company_name_en, avatar_url')
    .eq('id', project.owner_id)
    .single();

  const { data: ownerSub } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', project.owner_id)
    .eq('is_active', true)
    .single();
  const ownerTier = ownerSub?.tier || 'starter';

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch project files
  const { data: projectFiles } = await db(supabase)
    .from('project_files')
    .select('id, file_url, file_name, file_size, mime_type, category, created_at')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false });

  // Fetch more projects by the same owner
  const { data: moreFromOwner } = await db(supabase)
    .from('projects')
    .select('id, title_ar, title_en, slug_ar, slug_en, city_id, bid_count, created_at')
    .eq('owner_id', project.owner_id)
    .eq('status', 'published')
    .neq('id', project.id)
    .order('created_at', { ascending: false })
    .limit(4);

  return (
    <div className="py-16">
      <BreadcrumbOverride segment={slug} label={getLocaleField(project, 'title', locale)} />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {getLocaleField(project, 'title', locale)}
              </h1>
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
            {user && user.id === project.owner_id && (
              <Link href={`/dashboard/projects/${getEntitySlug(project, locale)}`}>
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4 me-1.5" />
                  {t('manageListing')}
                </Button>
              </Link>
            )}
          </div>

          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t('projectDescription')}</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {getLocaleField(project, 'description', locale)}
            </p>
          </Card>

          {projectFiles && projectFiles.length > 0 && (
            <FileDisplayList files={projectFiles} title={t('documentsAndFiles')} />
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-4 text-center">
              <div className="text-3xl font-bold text-foreground">{project.bid_count}</div>
              <div className="text-sm text-muted-foreground">{t('bidCount', { count: project.bid_count })}</div>
            </div>
            {user ? (
              <Link href={`/dashboard/projects/${getEntitySlug(project, locale)}/bid`} className="block">
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
              {project.city_id && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <dt className="text-muted-foreground">{t('city')}:</dt>
                  <dd className="font-medium text-foreground">{project.city_id}</dd>
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
                    <Image src={owner.avatar_url} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
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
                  {ownerTier && ownerTier !== 'starter' && (
                    <Badge
                      variant={ownerTier as 'pro' | 'business' | 'enterprise'}
                      className="mt-1"
                    >
                      <Shield className="me-1 h-3 w-3" />
                      {ownerTier}
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

      {/* More Projects by Owner */}
      {moreFromOwner && moreFromOwner.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-6 text-xl font-bold text-foreground">{t('moreFromOwner')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {moreFromOwner.map((item: { id: string; title_ar: string; title_en: string; slug_ar: string | null; slug_en: string | null; city_id: string | null; bid_count: number; created_at: string }) => (
              <Link key={item.id} href={`/projects/${getEntitySlug(item, locale) || item.id}`}>
                <Card className="p-4 transition-colors hover:bg-card/80 h-full">
                  <div className="flex h-12 items-center justify-center rounded-lg bg-muted mb-3">
                    <FolderOpen className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground line-clamp-2">
                    {getLocaleField(item, 'title', locale)}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.city_id && <span>{item.city_id} · </span>}
                    {item.bid_count} {t('bids')}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
