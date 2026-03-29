// =============================================================================
// Public — Partner Profile Page (redesigned with hero + tabs + reviews)
// =============================================================================

import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/features/empty-state';
import { PartnerProfileTabs } from '@/components/features/partners/partner-profile-tabs';
import { ReviewsDisplay } from '@/components/features/reviews/reviews-display';
import { formatSAR, getLocaleField, isUUID, getEntitySlug } from '@/lib/utils';
import { getTranslations, getLocale } from 'next-intl/server';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';
import {
  Building2,
  Shield,
  MapPin,
  Phone,
  Globe,
  Calendar,
  MessageSquare,
  FileText,
  Download,
  Linkedin,
  Instagram,
  Wrench,
  Star,
  Briefcase,
  Package,
  Banknote,
  CheckCircle2,
  FolderOpen,
  ShoppingBag,
} from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

// X/Twitter icon (lucide doesn't have it)
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default async function PartnerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const t = await getTranslations('public.partnerDetail');
  const locale = await getLocale();

  // UUID redirect
  if (isUUID(slug)) {
    const { data: record } = await db(supabase)
      .from('profiles')
      .select('slug_ar, slug_en')
      .eq('id', slug)
      .single();
    if (record) {
      const targetSlug = getEntitySlug(record, locale);
      if (targetSlug) redirect(`/partners/${targetSlug}`);
    }
    notFound();
  }

  // ---------------------------------------------------------------------------
  // Fetch partner profile
  // ---------------------------------------------------------------------------
  const slugCol = locale === 'ar' ? 'slug_ar' : 'slug_en';
  let { data: partner } = await db(supabase)
    .from('profiles')
    .select('*, saudi_cities(name_ar, name_en)')
    .eq(slugCol, slug)
    .in('role', ['contractor', 'supplier'])
    .single();

  if (!partner) {
    const fallbackCol = locale === 'ar' ? 'slug_en' : 'slug_ar';
    ({ data: partner } = await db(supabase)
      .from('profiles')
      .select('*, saudi_cities(name_ar, name_en)')
      .eq(fallbackCol, slug)
      .in('role', ['contractor', 'supplier'])
      .single());
  }

  if (!partner) notFound();

  // Visibility flags — default everything to visible
  const vis = partner.profile_visibility || {};
  const isVisible = (field: string) => vis[field] !== false;

  // Social links
  const social = partner.social_links || {};

  // ---------------------------------------------------------------------------
  // Parallel data fetching
  // ---------------------------------------------------------------------------
  const [
    { data: partnerSub },
    { data: companyDocs },
    { data: projects },
    { data: products },
    { data: reviews },
    { count: dealsCount },
    { count: projectsCount },
    { count: productsCount },
    { data: { user } },
  ] = await Promise.all([
    // Subscription
    db(supabase)
      .from('subscriptions')
      .select('tier')
      .eq('user_id', partner.id)
      .eq('is_active', true)
      .single(),

    // Company documents
    db(supabase)
      .from('company_documents')
      .select('id, display_name, file_url, file_name, file_size')
      .eq('user_id', partner.id)
      .order('sort_order', { ascending: true }),

    // Projects (contractors)
    partner.role === 'contractor'
      ? db(supabase)
          .from('projects')
          .select('id, title_ar, title_en, city, budget_min, budget_max, status, created_at, slug_ar, slug_en')
          .eq('owner_id', partner.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: null }),

    // Products (suppliers)
    partner.role === 'supplier'
      ? db(supabase)
          .from('products')
          .select('id, name_ar, name_en, price, pricing_model, in_stock, status, created_at, slug_ar, slug_en')
          .eq('supplier_id', partner.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: null }),

    // Reviews received
    db(supabase)
      .from('reviews')
      .select(`
        id, overall_rating, quality_rating, timeliness_rating, communication_rating,
        would_recommend, comment_ar, comment_en, created_at,
        reviewer:reviewer_id(company_name_ar, company_name_en, avatar_url),
        deal:deal_id(title_slug, deal_type)
      `)
      .eq('reviewee_id', partner.id)
      .order('created_at', { ascending: false })
      .limit(20),

    // Completed deals count
    db(supabase)
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .or(`seller_id.eq.${partner.id},buyer_id.eq.${partner.id}`)
      .eq('status', 'completed'),

    // Published projects count
    partner.role === 'contractor'
      ? db(supabase)
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', partner.id)
          .eq('status', 'published')
      : Promise.resolve({ count: 0 }),

    // Published products count
    partner.role === 'supplier'
      ? db(supabase)
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('supplier_id', partner.id)
          .eq('status', 'published')
      : Promise.resolve({ count: 0 }),

    // Current user
    supabase.auth.getUser(),
  ]);

  const partnerTier = partnerSub?.tier || 'starter';
  const cityName = partner.saudi_cities
    ? (locale === 'ar' ? partner.saudi_cities.name_ar : partner.saudi_cities.name_en)
    : null;

  const companyName = isVisible('company_name')
    ? (getLocaleField(partner, 'company_name', locale) || partner.full_name)
    : partner.full_name;

  const avgRating = Number(partner.average_rating) || 0;
  const totalReviews = Number(partner.total_reviews) || 0;
  const totalDeals = Number(dealsCount) || Number(partner.total_deals) || 0;
  const itemsCount = partner.role === 'contractor'
    ? (Number(projectsCount) || 0)
    : (Number(productsCount) || 0);

  const memberDate = new Date(partner.created_at).toLocaleDateString(
    locale === 'ar' ? 'ar-SA' : 'en-US',
    { year: 'numeric', month: 'long' },
  );

  // ---------------------------------------------------------------------------
  // Build tab content
  // ---------------------------------------------------------------------------

  // --- Overview tab ---
  const overviewContent = (
    <div className="space-y-6">
      {/* Bio */}
      {isVisible('bio') && (partner.bio_ar || partner.bio_en) && (
        <Card className="p-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">{t('aboutCompany')}</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {getLocaleField(partner, 'bio', locale)}
          </p>
        </Card>
      )}

      {/* Specializations */}
      {isVisible('specializations') && partner.specializations && partner.specializations.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Wrench className="h-5 w-5 text-primary" />
            {t('specializations')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {partner.specializations.map((spec: string) => (
              <Badge key={spec} variant="secondary">
                {t(`specializationLabels.${spec}` as never) || spec}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Company Information */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t('companyInfo')}</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          {isVisible('city') && cityName && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <dd className="text-sm text-foreground">{cityName}</dd>
            </div>
          )}
          {isVisible('phone') && partner.phone && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <dd className="text-sm text-foreground" dir="ltr">{partner.phone}</dd>
            </div>
          )}
          {isVisible('website') && partner.website && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <dd className="truncate text-sm text-foreground">
                <a href={partner.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  {partner.website.replace(/^https?:\/\//, '')}
                </a>
              </dd>
            </div>
          )}
          {isVisible('cr_number') && partner.cr_number && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <dd className="text-sm text-foreground" dir="ltr">{t('crNumber')}: {partner.cr_number}</dd>
            </div>
          )}
          {isVisible('established_year') && partner.established_year && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <dd className="text-sm text-foreground">{t('established', { year: partner.established_year })}</dd>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <dd className="text-sm text-muted-foreground">{t('memberSince', { date: memberDate })}</dd>
          </div>
        </dl>

        {/* Social links inside company info */}
        {isVisible('social_links') && (social.linkedin || social.twitter || social.instagram) && (
          <div className="mt-5 border-t border-border pt-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t('socialLinks')}</h3>
            <div className="flex gap-3">
              {social.linkedin && (
                <a href={social.linkedin} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {social.twitter && (
                <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
                  <XIcon className="h-4 w-4" />
                </a>
              )}
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Company Documents */}
      {isVisible('documents') && companyDocs && companyDocs.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            {t('companyDocuments')}
          </h2>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {companyDocs.map((doc: any) => (
              <a
                key={doc.id}
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <FileText className="h-5 w-5 shrink-0 text-destructive/70" />
                <span className="flex-1 truncate text-sm font-medium text-foreground">
                  {doc.display_name}
                </span>
                <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        </Card>
      )}
    </div>
  );

  // --- Projects tab (contractors) ---
  const projectsContent = (
    <div>
      {projects && projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {projects.map((p: any) => (
            <Link key={p.id} href={`/projects/${getEntitySlug(p, locale)}`}>
              <Card className="h-full p-4 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md">
                <h3 className="font-semibold text-foreground line-clamp-2">
                  {getLocaleField(p, 'title', locale)}
                </h3>
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  {p.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {p.city}
                    </span>
                  )}
                  {(p.budget_min || p.budget_max) && (
                    <span className="flex items-center gap-1">
                      <Banknote className="h-3 w-3" />
                      {p.budget_min ? formatSAR(p.budget_min) : '—'} – {p.budget_max ? formatSAR(p.budget_max) : '—'}
                    </span>
                  )}
                </div>
                <div className="mt-3 border-t border-border pt-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FolderOpen className="h-12 w-12" />}
          title={t('noProjects')}
          description={t('noProjectsDesc')}
        />
      )}
    </div>
  );

  // --- Products tab (suppliers) ---
  const productsContent = (
    <div>
      {products && products.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {products.map((p: any) => (
            <Link key={p.id} href={`/products/${getEntitySlug(p, locale)}`}>
              <Card className="h-full p-4 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md">
                <div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-muted/50">
                  <Package className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="font-semibold text-foreground line-clamp-1">
                  {getLocaleField(p, 'name', locale)}
                </h3>
                <div className="mt-2 flex items-center justify-between">
                  {p.price ? (
                    <span className="text-sm font-bold text-foreground">{formatSAR(p.price)}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('variantPricing')}</span>
                  )}
                  <Badge variant={p.in_stock ? 'success' : 'destructive'} className="text-xs">
                    {p.in_stock ? t('inStock') : t('outOfStock')}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ShoppingBag className="h-12 w-12" />}
          title={t('noProducts')}
          description={t('noProductsDesc')}
        />
      )}
    </div>
  );

  // --- Reviews tab ---
  const reviewsContent = (
    <div>
      {reviews && reviews.length > 0 ? (
        <ReviewsDisplay
          reviews={reviews}
          averageRating={avgRating}
          totalCount={totalReviews}
        />
      ) : (
        <EmptyState
          icon={<Star className="h-12 w-12" />}
          title={t('noReviews')}
          description={t('noReviewsDesc')}
        />
      )}
    </div>
  );

  // Build the tabs array dynamically
  const tabs = [
    { key: 'overview', label: t('overview'), content: overviewContent },
    partner.role === 'contractor'
      ? { key: 'projects', label: t('projects'), count: itemsCount, content: projectsContent }
      : { key: 'products', label: t('products'), count: itemsCount, content: productsContent },
    { key: 'reviews', label: t('reviews'), count: totalReviews, content: reviewsContent },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="py-8">
      <BreadcrumbOverride segment={slug} label={companyName} />

      {/* ===== HERO SECTION ===== */}
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: Logo + Info */}
          <div className="flex items-start gap-4 sm:gap-5">
            {/* Logo / Avatar */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 ring-2 ring-primary/20">
              {partner.logo_url ? (
                <Image src={partner.logo_url} alt="" width={80} height={80} className="h-20 w-20 rounded-xl object-cover" />
              ) : partner.avatar_url ? (
                <Image src={partner.avatar_url} alt="" width={80} height={80} className="h-20 w-20 rounded-xl object-cover" />
              ) : (
                <Building2 className="h-10 w-10 text-primary" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              {/* Name + small avatar */}
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{companyName}</h1>
                {partner.logo_url && partner.avatar_url && (
                  <Image src={partner.avatar_url} alt="" width={32} height={32} className="h-8 w-8 rounded-full border-2 border-background object-cover" />
                )}
              </div>

              {/* Badges */}
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant={partner.role === 'contractor' ? 'info' : 'warning'}>
                  {partner.role === 'contractor' ? t('contractor') : t('supplier')}
                </Badge>
                {partner.verification_status === 'active' && (
                  <Badge variant="success">
                    <CheckCircle2 className="me-1 h-3 w-3" />
                    {t('verified')}
                  </Badge>
                )}
                {partnerTier && partnerTier !== 'starter' && (
                  <Badge variant={partnerTier as 'pro' | 'business' | 'enterprise'}>
                    <Shield className="me-1 h-3 w-3" />{partnerTier}
                  </Badge>
                )}
                {isVisible('city') && cityName && (
                  <Badge variant="secondary"><MapPin className="me-1 h-3 w-3" />{cityName}</Badge>
                )}
                {isVisible('established_year') && partner.established_year && (
                  <Badge variant="secondary">
                    <Calendar className="me-1 h-3 w-3" />
                    {t('established', { year: partner.established_year })}
                  </Badge>
                )}
              </div>

              {/* Bio preview below the name on large screens */}
              {isVisible('bio') && (partner.bio_ar || partner.bio_en) && (
                <p className="mt-2 hidden text-sm text-muted-foreground line-clamp-2 sm:block">
                  {getLocaleField(partner, 'bio', locale)}
                </p>
              )}
            </div>
          </div>

          {/* Right: Contact CTA */}
          <div className="shrink-0 sm:pt-1">
            {user ? (
              <Button size="lg">
                <MessageSquare className="me-2 h-4 w-4" />
                {t('sendMessage')}
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="lg">{t('loginToContact')}</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5 sm:flex sm:gap-6">
          {/* Rating */}
          {avgRating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= Math.round(avgRating) ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-foreground">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({totalReviews})</span>
            </div>
          )}

          {/* Deals */}
          {totalDeals > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4 text-primary/60" />
              <span className="font-medium text-foreground">{totalDeals}</span>
              <span>{t('statsDeals', { count: totalDeals })}</span>
            </div>
          )}

          {/* Projects or Products count */}
          {itemsCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {partner.role === 'contractor' ? (
                <>
                  <FolderOpen className="h-4 w-4 text-primary/60" />
                  <span className="font-medium text-foreground">{itemsCount}</span>
                  <span>{t('statsProjects', { count: itemsCount })}</span>
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 text-primary/60" />
                  <span className="font-medium text-foreground">{itemsCount}</span>
                  <span>{t('statsProducts', { count: itemsCount })}</span>
                </>
              )}
            </div>
          )}

          {/* Member since */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{t('memberSince', { date: memberDate })}</span>
          </div>
        </div>
      </div>

      {/* ===== TABBED CONTENT ===== */}
      <div className="mt-8">
        <PartnerProfileTabs tabs={tabs} defaultTab="overview" />
      </div>
    </div>
  );
}
