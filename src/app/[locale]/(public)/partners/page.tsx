// =============================================================================
// Partners Page — verified contractor/supplier directory
// =============================================================================

import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/features/empty-state';
import { Building2, Shield, Star, Search, Users } from 'lucide-react';
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
    .select('id, full_name, company_name_ar, company_name_en, avatar_url, role, city, bio_ar, bio_en, created_at')
    .in('role', ['contractor', 'supplier'])
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (filters.role && ['contractor', 'supplier'].includes(filters.role)) {
    query = query.eq('role', filters.role);
  }
  if (filters.city) {
    query = query.eq('city', filters.city);
  }
  if (filters.q) {
    query = query.or(
      `company_name_ar.ilike.%${filters.q}%,company_name_en.ilike.%${filters.q}%,full_name.ilike.%${filters.q}%`
    );
  }

  const { data: partners } = await query;

  // Fetch subscription tiers for all partners
  const partnerIds = (partners ?? []).map((p: any) => p.id);
  const { data: subs } = partnerIds.length > 0
    ? await db(supabase)
        .from('subscriptions')
        .select('user_id, tier')
        .in('user_id', partnerIds)
        .eq('is_active', true)
    : { data: [] };
  const tierMap = new Map((subs ?? []).map((s: any) => [s.user_id, s.tier]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
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
          {partners.map((partner: any) => (
            <Link key={partner.id} href={`/partners/${partner.id}`}>
              <Card className="h-full p-5 transition-all hover:border-primary/30 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    {partner.avatar_url ? (
                      <img
                        src={partner.avatar_url}
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

                {partner.bio_ar && (
                  <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                    {locale === 'ar' ? partner.bio_ar : (partner.bio_en || partner.bio_ar)}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant={partner.role === 'contractor' ? 'info' : 'warning'}>
                    {partner.role === 'contractor' ? t('contractor') : t('supplier')}
                  </Badge>
                  {partner.city && (
                    <Badge variant="secondary">{partner.city}</Badge>
                  )}
                  {tierMap.get(partner.id) && tierMap.get(partner.id) !== 'starter' && (
                    <Badge variant={tierMap.get(partner.id) as 'pro' | 'business' | 'enterprise'}>
                      <Shield className="me-1 h-3 w-3" />
                      {tierMap.get(partner.id)}
                    </Badge>
                  )}
                </div>
              </Card>
            </Link>
          ))}
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
