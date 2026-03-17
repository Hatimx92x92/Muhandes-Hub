// =============================================================================
// Public — Partner Profile Page
// =============================================================================

import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/features/empty-state';
import { formatSAR, getLocaleField } from '@/lib/utils';
import { getTranslations, getLocale } from 'next-intl/server';
import {
  Building2,
  Shield,
  MapPin,
  Phone,
  Globe,
  Mail,
  Briefcase,
  Package,
  Calendar,
  ArrowRight,
  Star,
  MessageSquare,
} from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function PartnerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const t = await getTranslations('public.partnerDetail');
  const locale = await getLocale();

  const { data: partner } = await db(supabase)
    .from('profiles')
    .select('*')
    .eq('id', id)
    .in('role', ['contractor', 'supplier'])
    .eq('status', 'active')
    .single();

  if (!partner) notFound();

  const { data: partnerSub } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', id)
    .eq('is_active', true)
    .single();
  const partnerTier = partnerSub?.tier || 'starter';

  const { data: projects } = partner.role === 'contractor'
    ? await db(supabase)
        .from('projects')
        .select('id, title_ar, title_en, city, budget_min, budget_max, status, created_at')
        .eq('owner_id', id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(6)
    : { data: null };

  const { data: products } = partner.role === 'supplier'
    ? await db(supabase)
        .from('products')
        .select('id, name_ar, name_en, price, pricing_model, in_stock, status, created_at')
        .eq('supplier_id', id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(6)
    : { data: null };

  const { data: { user } } = await supabase.auth.getUser();

  const companyName = locale === 'ar'
    ? (partner.company_name_ar || partner.full_name)
    : (partner.company_name_en || partner.company_name_ar || partner.full_name);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Link
        href="/partners"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        {t('backToPartners')}
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
                {partner.avatar_url ? (
                  <img src={partner.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <Building2 className="h-8 w-8 text-primary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-foreground">{companyName}</h1>
                {partner.company_name_en && locale === 'ar' && (
                  <p className="text-sm text-muted-foreground" dir="ltr">{partner.company_name_en}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={partner.role === 'contractor' ? 'info' : 'warning'}>
                    {partner.role === 'contractor' ? t('contractor') : t('supplier')}
                  </Badge>
                  {partnerTier && partnerTier !== 'starter' && (
                    <Badge variant={partnerTier as 'pro' | 'business' | 'enterprise'}>
                      <Shield className="me-1 h-3 w-3" />{partnerTier}
                    </Badge>
                  )}
                  {partner.city && (
                    <Badge variant="secondary"><MapPin className="me-1 h-3 w-3" />{partner.city}</Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {(partner.bio_ar || partner.bio_en) && (
            <Card className="p-6">
              <h2 className="mb-3 text-lg font-semibold text-foreground">{t('aboutCompany')}</h2>
              {partner.bio_ar && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{partner.bio_ar}</p>
              )}
              {partner.bio_en && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground" dir="ltr">{partner.bio_en}</p>
              )}
            </Card>
          )}

          {projects && projects.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-foreground">{t('publishedProjects')}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {projects.map((p: any) => (
                  <Link key={p.id} href={`/projects/${p.id}`}>
                    <Card className="h-full p-4 transition-colors hover:bg-card/80">
                      <h3 className="font-medium text-foreground line-clamp-1">{getLocaleField(p, 'title', locale)}</h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {p.city && (<span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.city}</span>)}
                        {(p.budget_min || p.budget_max) && (
                          <span>{p.budget_min ? formatSAR(p.budget_min) : '—'} – {p.budget_max ? formatSAR(p.budget_max) : '—'}</span>
                        )}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {products && products.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-foreground">{t('listedProducts')}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {products.map((p: any) => (
                  <Link key={p.id} href={`/products/${p.id}`}>
                    <Card className="h-full p-4 transition-colors hover:bg-card/80">
                      <h3 className="font-medium text-foreground line-clamp-1">{getLocaleField(p, 'name', locale)}</h3>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        {p.price ? (
                          <span className="font-semibold text-foreground">{formatSAR(p.price)}</span>
                        ) : (
                          <span className="text-muted-foreground">{t('variantPricing')}</span>
                        )}
                        <Badge variant={p.in_stock ? 'success' : 'destructive'}>
                          {p.in_stock ? t('inStock') : t('outOfStock')}
                        </Badge>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t('contact')}</h3>
            {user ? (
              <Button className="w-full">
                <MessageSquare className="me-2 h-4 w-4" />
                {t('sendMessage')}
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="outline" className="w-full">{t('loginToContact')}</Button>
              </Link>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t('companyInfo')}</h3>
            <dl className="space-y-2.5 text-sm">
              {partner.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <dd className="text-foreground">{partner.city}</dd>
                </div>
              )}
              {partner.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <dd className="text-foreground" dir="ltr">{partner.phone}</dd>
                </div>
              )}
              {partner.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <dd className="truncate text-foreground">{partner.website}</dd>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <dd className="text-muted-foreground">
                  {t('memberSince', { date: new Date(partner.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long' }) })}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
