// =============================================================================
// Partners Page — verified contractor/supplier directory
// =============================================================================

import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/features/empty-state';
import { Building2, Shield, Star, Search, Users, Briefcase, Package } from 'lucide-react';
import { getLocaleField, getEntitySlug } from '@/lib/utils';
import { getTranslations, getLocale } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; city?: string }>;
}) {
  const filters = await searchParams;
  const supabase = await createClient();
  const t = await getTranslations('public.partners');
  const locale = await getLocale();

  let query = db(supabase)
    .from('profiles')
    .select('id, full_name, company_name_ar, company_name_en, avatar_url, logo_url, role, city_id, bio_ar, bio_en, average_rating, total_reviews, total_deals, created_at, slug_ar, slug_en, saudi_cities(name_ar, name_en), subscriptions(tier, is_active)')
    .in('role', ['contractor', 'supplier'])
    .eq('verification_status', 'active')
    .not('slug_ar', 'is', null)
    .not('slug_en', 'is', null)
    .order('created_at', { ascending: false });

  if (filters.role && ['contractor', 'supplier'].includes(filters.role)) {
    query = query.eq('role', filters.role);
  }
  if (filters.city) {
    query = query.eq('city_id', filters.city);
  }
  if (filters.q) {
    query = query.or(
      `company_name_ar.ilike.%${filters.q}%,company_name_en.ilike.%${filters.q}%,full_name.ilike.%${filters.q}%`
    );
  }

  const { data: partners } = await query;

  // Fetch published project/product counts for each partner
  const contractorIds = (partners ?? []).filter((p: any) => p.role === 'contractor').map((p: any) => p.id);
  const supplierIds = (partners ?? []).filter((p: any) => p.role === 'supplier').map((p: any) => p.id);

  const [{ data: projectRows }, { data: productRows }] = await Promise.all([
    contractorIds.length > 0
      ? db(supabase).from('projects').select('owner_id').in('owner_id', contractorIds).eq('status', 'published')
      : Promise.resolve({ data: [] }),
    supplierIds.length > 0
      ? db(supabase).from('products').select('supplier_id').in('supplier_id', supplierIds).eq('status', 'published')
      : Promise.resolve({ data: [] }),
  ]);

  const projectCountMap = new Map<string, number>();
  (projectRows ?? []).forEach((r: any) => projectCountMap.set(r.owner_id, (projectCountMap.get(r.owner_id) || 0) + 1));
  const productCountMap = new Map<string, number>();
  (productRows ?? []).forEach((r: any) => productCountMap.set(r.supplier_id, (productCountMap.get(r.supplier_id) || 0) + 1));

  return (
    <div className="py-16">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-8 p-4">
        <form className="flex flex-wrap gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder={t('searchPlaceholder')}
              defaultValue={filters.q ?? ''}
              className="ps-10"
            />
          </div>
          <select
            name="role"
            defaultValue={filters.role ?? ''}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">{t('allRoles')}</option>
            <option value="contractor">{t('contractor')}</option>
            <option value="supplier">{t('supplier')}</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
          >
            {t('search')}
          </button>
        </form>
      </Card>

      {/* Partners Grid */}
      {partners && partners.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {partners.map((partner: any) => {
            const imgUrl = partner.logo_url || partner.avatar_url;
            const projectCount = projectCountMap.get(partner.id) || 0;
            const productCount = productCountMap.get(partner.id) || 0;
            const activeSub = partner.subscriptions?.find((s: any) => s.is_active && s.tier !== 'starter');

            return (
              <Link key={partner.id} href={`/partners/${getEntitySlug(partner, locale)}`}>
                <Card className="h-full p-5 transition-all hover:border-primary/30 hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-foreground">
                        {locale === 'ar' ? (partner.company_name_ar || partner.full_name) : (partner.company_name_en || partner.company_name_ar || partner.full_name)}
                      </h3>
                      {partner.company_name_en && locale === 'ar' && (
                        <p className="truncate text-xs text-muted-foreground" dir="ltr">
                          {partner.company_name_en}
                        </p>
                      )}
                    </div>
                  </div>

                  {(partner.bio_ar || partner.bio_en) && (
                    <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                      {locale === 'ar' ? (partner.bio_ar || partner.bio_en) : (partner.bio_en || partner.bio_ar)}
                    </p>
                  )}

                  {/* Rating & Stats */}
                  {(partner.average_rating > 0 || partner.total_deals > 0) && (
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      {partner.average_rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-medium text-foreground">{Number(partner.average_rating).toFixed(1)}</span>
                          {partner.total_reviews > 0 && (
                            <span>{t('reviews', { count: partner.total_reviews })}</span>
                          )}
                        </span>
                      )}
                      {partner.total_deals > 0 && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {t('completedDeals', { count: partner.total_deals })}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Published projects / products count */}
                  {(projectCount > 0 || productCount > 0) && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      {partner.role === 'contractor' && projectCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5 text-primary/60" />
                          {t('publishedProjects', { count: projectCount })}
                        </span>
                      )}
                      {partner.role === 'supplier' && productCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5 text-primary/60" />
                          {t('listedProducts', { count: productCount })}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Badges */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge variant={partner.role === 'contractor' ? 'info' : 'warning'}>
                      {partner.role === 'contractor' ? t('contractor') : t('supplier')}
                    </Badge>
                    {partner.saudi_cities && (
                      <Badge variant="secondary">
                        {locale === 'ar' ? partner.saudi_cities.name_ar : partner.saudi_cities.name_en}
                      </Badge>
                    )}
                    {activeSub && (
                      <Badge variant={activeSub.tier as 'pro' | 'business' | 'enterprise'}>
                        <Shield className="me-1 h-3 w-3" />
                        {activeSub.tier}
                      </Badge>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="h-10 w-10 text-muted-foreground" />}
          title={t('noResults')}
          description={t('noResultsDesc')}
        />
      )}
    </div>
  );
}
