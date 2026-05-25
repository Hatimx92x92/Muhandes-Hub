// =============================================================================
// Public — Project Detail Page
// =============================================================================

import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { after } from 'next/server';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { backfillEntityTranslation } from '@/actions/admin/translate-backfill';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/features/user-avatar';
import { formatSAR, formatDate, getLocaleField, isUUID, getEntitySlug } from '@/lib/utils';
import { MapPin, Banknote, Calendar, Users, Building2, Shield, FolderOpen, Pencil, ImageIcon } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';
import { FileDisplayList } from '@/components/features/file-display-list';
import { BidForm } from '@/components/forms/bid-form';
import { getProxyUrl } from '@/lib/file-utils';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://muhandeshub.com';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

// ---------------------------------------------------------------------------
// SEO — generateMetadata
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  setRequestLocale(locale);
  let slug: string;
  try { slug = decodeURIComponent(rawSlug); } catch { slug = rawSlug; }
  const supabase = await createClient();

  if (isUUID(slug)) return {};

  const slugCol = locale === 'ar' ? 'slug_ar' : 'slug_en';
  let { data: project } = await db(supabase)
    .from('projects')
    .select('title_ar, title_en, description_ar, description_en, slug_ar, slug_en, created_at')
    .eq(slugCol, slug)
    .eq('status', 'published')
    .single();

  if (!project) {
    const fallbackCol = locale === 'ar' ? 'slug_en' : 'slug_ar';
    ({ data: project } = await db(supabase)
      .from('projects')
      .select('title_ar, title_en, description_ar, description_en, slug_ar, slug_en, created_at')
      .eq(fallbackCol, slug)
      .eq('status', 'published')
      .single());
  }

  if (!project) return {};

  const title = getLocaleField(project, 'title', locale);
  const description = getLocaleField(project, 'description', locale)?.slice(0, 160) || '';
  const arSlug = project.slug_ar || project.slug_en || slug;
  const enSlug = project.slug_en || project.slug_ar || slug;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      alternateLocale: locale === 'ar' ? 'en_US' : 'ar_SA',
      siteName: 'Muhandes HUB',
      publishedTime: project.created_at,
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/projects/${slug}`,
      languages: {
        ar: `${BASE_URL}/ar/projects/${arSlug}`,
        en: `${BASE_URL}/en/projects/${enSlug}`,
      },
    },
  };
}

export default async function PublicProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug: rawSlug } = await params;
  setRequestLocale(locale);
  let slug: string;
  try { slug = decodeURIComponent(rawSlug); } catch { slug = rawSlug; }
  const supabase = await createClient();
  const t = await getTranslations('public.projectDetail');

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
    .select('id, title_ar, title_en, description_ar, description_en, city_id, budget_min, budget_max, source, classification, bid_count, created_at, timeline_start, timeline_end, owner_id, slug_ar, slug_en, saudi_cities(name_ar, name_en)')
    .eq(slugCol, slug)
    .eq('status', 'published')
    .single();

  if (!project) {
    const fallbackCol = locale === 'ar' ? 'slug_en' : 'slug_ar';
    ({ data: project } = await db(supabase)
      .from('projects')
      .select('id, title_ar, title_en, description_ar, description_en, city_id, budget_min, budget_max, source, classification, bid_count, created_at, timeline_start, timeline_end, owner_id, slug_ar, slug_en, saudi_cities(name_ar, name_en)')
      .eq(fallbackCol, slug)
      .eq('status', 'published')
      .single());
  }

  if (!project) notFound();

  // Backfill missing locale fields after render (fire-and-forget, free DeepL)
  if (!project[`title_${locale}`] || !project[`description_${locale}`]) {
    after(() => backfillEntityTranslation('projects', project.id, project, ['title', 'description']));
  }

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

  // Fetch user role and check if already bid (for inline bid form)
  let userRole: string | null = null;
  let existingBid = false;
  if (user) {
    const { data: userProfile } = await db(supabase)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    userRole = userProfile?.role ?? null;

    if (userRole === 'contractor') {
      const { data: bid } = await db(supabase)
        .from('bids')
        .select('id')
        .eq('project_id', project.id)
        .eq('contractor_id', user.id)
        .single();
      existingBid = !!bid;
    }
  }

  const canBid = user && userRole === 'contractor' && user.id !== project.owner_id && !existingBid;

  // Fetch project files
  const { data: projectFiles } = await db(supabase)
    .from('project_files')
    .select('id, file_url, file_name, file_size, mime_type, category, created_at')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false });

  // Fetch more projects by the same owner
  const { data: moreFromOwner } = await db(supabase)
    .from('projects')
    .select('id, title_ar, title_en, slug_ar, slug_en, city_id, bid_count, created_at, saudi_cities(name_ar, name_en)')
    .eq('owner_id', project.owner_id)
    .eq('status', 'published')
    .neq('id', project.id)
    .order('created_at', { ascending: false })
    .limit(4);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: locale === 'ar' ? 'الرئيسية' : 'Home', item: `${BASE_URL}/${locale}` },
      { '@type': 'ListItem', position: 2, name: locale === 'ar' ? 'المشاريع' : 'Projects', item: `${BASE_URL}/${locale}/projects` },
      { '@type': 'ListItem', position: 3, name: getLocaleField(project, 'title', locale), item: `${BASE_URL}/${locale}/projects/${slug}` },
    ],
  };

  return (
    <div className="py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
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

          {/* Project Images Gallery */}
          {(() => {
            const imageFiles = (projectFiles ?? []).filter((f: { category: string }) => f.category === 'images');
            if (imageFiles.length === 0) return null;
            return (
              <div className="space-y-3">
                <div className={`grid gap-2 ${imageFiles.length === 1 ? '' : 'grid-cols-2'}`}>
                  {imageFiles.slice(0, 1).map((img: { id: string; file_url: string; file_name: string }) => (
                    <div key={img.id} className={`relative aspect-video overflow-hidden rounded-xl ${imageFiles.length > 1 ? 'row-span-2' : ''}`}>
                      <Image
                        src={getProxyUrl(img.file_url)}
                        alt={img.file_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        priority
                      />
                    </div>
                  ))}
                  {imageFiles.length > 1 && (
                    <div className="grid gap-2">
                      {imageFiles.slice(1, 3).map((img: { id: string; file_url: string; file_name: string }) => (
                        <div key={img.id} className="relative aspect-video overflow-hidden rounded-xl">
                          <Image
                            src={getProxyUrl(img.file_url)}
                            alt={img.file_name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 50vw, 33vw"
                          />
                        </div>
                      ))}
                      {imageFiles.length > 3 && (
                        <div className="relative aspect-video overflow-hidden rounded-xl">
                          <Image
                            src={getProxyUrl(imageFiles[3].file_url)}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white">
                            +{imageFiles.length - 3}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t('projectDescription')}</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {getLocaleField(project, 'description', locale)}
            </p>
          </Card>

          {/* Documents (non-image files only) */}
          {(() => {
            const docFiles = (projectFiles ?? []).filter((f: { category: string }) => f.category !== 'images');
            if (docFiles.length === 0) return null;
            return <FileDisplayList files={docFiles} title={t('documentsAndFiles')} />;
          })()}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-4 text-center">
              <div className="text-3xl font-bold text-foreground">{project.bid_count}</div>
              <div className="text-sm text-muted-foreground">{t('bidCount', { count: project.bid_count })}</div>
            </div>
            {!user && (
              <Link href="/login" className="block">
                <Button className="w-full" variant="outline">
                  {t('loginToSubmitBid')}
                </Button>
              </Link>
            )}
            {user && existingBid && (
              <p className="text-center text-sm text-muted-foreground">{t('alreadyBid')}</p>
            )}
            {user && !canBid && !existingBid && user.id !== project.owner_id && (
              <p className="text-center text-sm text-muted-foreground">{t('contractorsOnly')}</p>
            )}
          </Card>

          {/* Inline Bid Form */}
          {canBid && (
            <Card className="p-5">
              <h3 className="mb-4 text-lg font-semibold text-foreground">{t('submitBid')}</h3>
              <BidForm
                projectId={project.id}
                projectTitle={getLocaleField(project, 'title', locale)}
              />
            </Card>
          )}

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t('projectDetails')}</h3>
            <dl className="space-y-3 text-sm">
              {project.city_id && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <dt className="text-muted-foreground">{t('city')}:</dt>
                  <dd className="font-medium text-foreground">{locale === 'ar' ? project.saudi_cities?.name_ar : project.saudi_cities?.name_en}</dd>
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
                <UserAvatar src={owner.avatar_url} name={owner.full_name} size="md" />
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
            {moreFromOwner.map((item: { id: string; title_ar: string; title_en: string; slug_ar: string | null; slug_en: string | null; city_id: string | null; bid_count: number; created_at: string; saudi_cities: { name_ar: string; name_en: string } | null }) => (
              <Link key={item.id} href={`/projects/${getEntitySlug(item, locale) || item.id}`}>
                <Card className="p-4 transition-colors hover:bg-card/80 h-full">
                  <div className="flex h-12 items-center justify-center rounded-lg bg-muted mb-3">
                    <FolderOpen className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground line-clamp-2">
                    {getLocaleField(item, 'title', locale)}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.saudi_cities && <span>{locale === 'ar' ? item.saudi_cities.name_ar : item.saudi_cities.name_en} · </span>}
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
