// =============================================================================
// Public RFQ Detail Page
// =============================================================================

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { after } from 'next/server';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { backfillEntityTranslation } from '@/actions/admin/translate-backfill';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatSAR, formatDate, getLocaleField, isUUID, getEntitySlug } from '@/lib/utils';
import { ShoppingCart, Calendar, Banknote, MessageSquare, User } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';

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
  let { data: rfq } = await db(supabase)
    .from('rfqs')
    .select('title_ar, title_en, description_ar, description_en, slug_ar, slug_en, created_at')
    .eq(slugCol, slug)
    .eq('status', 'published')
    .single();

  if (!rfq) {
    const fallbackCol = locale === 'ar' ? 'slug_en' : 'slug_ar';
    ({ data: rfq } = await db(supabase)
      .from('rfqs')
      .select('title_ar, title_en, description_ar, description_en, slug_ar, slug_en, created_at')
      .eq(fallbackCol, slug)
      .eq('status', 'published')
      .single());
  }

  if (!rfq) return {};

  const title = getLocaleField(rfq, 'title', locale);
  const description = getLocaleField(rfq, 'description', locale)?.slice(0, 160) || '';
  const arSlug = rfq.slug_ar || rfq.slug_en || slug;
  const enSlug = rfq.slug_en || rfq.slug_ar || slug;

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
      publishedTime: rfq.created_at,
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/rfqs/${slug}`,
      languages: {
        ar: `${BASE_URL}/ar/rfqs/${arSlug}`,
        en: `${BASE_URL}/en/rfqs/${enSlug}`,
      },
    },
  };
}

export default async function PublicRFQDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug: rawSlug } = await params;
  setRequestLocale(locale);
  let slug: string;
  try { slug = decodeURIComponent(rawSlug); } catch { slug = rawSlug; }
  const supabase = await createClient();
  const t = await getTranslations('public.rfqDetail');

  // UUID redirect
  if (isUUID(slug)) {
    const { data: record } = await db(supabase)
      .from('rfqs')
      .select('slug_ar, slug_en')
      .eq('id', slug)
      .single();
    if (record) {
      const targetSlug = getEntitySlug(record, locale);
      if (targetSlug) redirect(`/rfqs/${targetSlug}`);
    }
    notFound();
  }

  const slugCol = locale === 'ar' ? 'slug_ar' : 'slug_en';
  let { data: rfq } = await db(supabase)
    .from('rfqs')
    .select('id, title_ar, title_en, description_ar, description_en, quantity, budget_min, budget_max, deadline, response_count, created_at, poster_id, slug_ar, slug_en')
    .eq(slugCol, slug)
    .eq('status', 'published')
    .single();

  if (!rfq) {
    const fallbackCol = locale === 'ar' ? 'slug_en' : 'slug_ar';
    ({ data: rfq } = await db(supabase)
      .from('rfqs')
      .select('id, title_ar, title_en, description_ar, description_en, quantity, budget_min, budget_max, deadline, response_count, created_at, poster_id, slug_ar, slug_en')
      .eq(fallbackCol, slug)
      .eq('status', 'published')
      .single());
  }

  if (!rfq) notFound();

  // Backfill missing locale fields after render (fire-and-forget, free DeepL)
  if (!rfq[`title_${locale}`] || !rfq[`description_${locale}`]) {
    after(() => backfillEntityTranslation('rfqs', rfq.id, rfq, ['title', 'description']));
  }

  const { data: poster } = await db(supabase)
    .from('profiles')
    .select('full_name, company_name_ar, company_name_en, role, slug_ar, slug_en')
    .eq('id', rfq.poster_id)
    .single();

  const title = getLocaleField(rfq, 'title', locale);
  const description = getLocaleField(rfq, 'description', locale);
  const isExpired = rfq.deadline && new Date(rfq.deadline) < new Date();

  const roleLabels: Record<string, string> = {
    project_owner: t('roleProjectOwner'),
    contractor: t('roleContractor'),
    supplier: t('roleSupplier'),
    buyer: t('roleBuyer'),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: locale === 'ar' ? 'الرئيسية' : 'Home', item: `${BASE_URL}/${locale}` },
      { '@type': 'ListItem', position: 2, name: locale === 'ar' ? 'طلبات العروض' : 'RFQs', item: `${BASE_URL}/${locale}/rfqs` },
      { '@type': 'ListItem', position: 3, name: title, item: `${BASE_URL}/${locale}/rfqs/${slug}` },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <BreadcrumbOverride segment={slug} label={title} />
      <div className="mb-8">
        <div className="flex items-start gap-3 mb-2">
          <ShoppingCart className="h-7 w-7 text-primary mt-1" />
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {isExpired ? (
            <Badge variant="secondary">{t('deadlineExpired')}</Badge>
          ) : (
            <Badge variant="published">{t('open')}</Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {t('publishedAt', { date: formatDate(rfq.created_at) })}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-base font-semibold text-foreground mb-3">{t('description')}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {description}
            </p>
          </Card>

          {!isExpired && (
            <Card className="p-6 bg-primary/5 border-primary/20">
              <h3 className="text-base font-semibold text-foreground mb-2">
                {t('areYouSupplier')}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('loginToRespondDesc')}
              </p>
              <Link
                href={`/login?redirect=/dashboard/rfqs/${getEntitySlug(rfq, locale)}`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t('loginToRespond')}
              </Link>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t('requestDetails')}</h3>

            {(rfq.budget_min || rfq.budget_max) && (
              <div className="flex items-center gap-2 text-sm">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('budgetLabel')}</p>
                  <p className="font-medium text-foreground">
                    {rfq.budget_min ? `${formatSAR(rfq.budget_min)} — ` : ''}
                    {rfq.budget_max ? formatSAR(rfq.budget_max) : t('unspecified')}
                  </p>
                </div>
              </div>
            )}

            {rfq.quantity && (
              <div className="text-sm">
                <p className="text-xs text-muted-foreground">{t('quantityRequired')}</p>
                <p className="font-medium text-foreground">{rfq.quantity}</p>
              </div>
            )}

            {rfq.deadline && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('deadline')}</p>
                  <p className="font-medium text-foreground">{formatDate(rfq.deadline)}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('responses')}</p>
                <p className="font-medium text-foreground">{t('responseCount', { count: rfq.response_count ?? 0 })}</p>
              </div>
            </div>
          </Card>

          {poster && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">{t('poster')}</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {locale === 'ar'
                      ? (poster.company_name_ar || poster.full_name)
                      : (poster.company_name_en || poster.company_name_ar || poster.full_name)}
                  </p>
                  <Badge variant={poster.role as 'contractor' | 'supplier' | 'buyer' | 'project_owner'} className="mt-0.5">
                    {roleLabels[poster.role] || poster.role}
                  </Badge>
                </div>
              </div>
              <Link
                href={`/partners/${poster ? getEntitySlug(poster, locale) : rfq.poster_id}`}
                className="mt-3 block text-xs text-primary hover:underline"
              >
                {t('viewProfile')}
              </Link>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}
