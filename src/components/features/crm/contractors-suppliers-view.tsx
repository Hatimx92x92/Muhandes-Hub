// =============================================================================
// Contractors & Suppliers View — Project Owner CRM replacement
// Two tabs: "Worked With" (from completed deals) + "Saved" (from CRM clients)
// =============================================================================

'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn, formatSAR } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';
import { UserAvatar } from '@/components/features/user-avatar';
import { EmptyState } from '@/components/features/empty-state';
import {
  Star,
  Briefcase,
  Search,
  ArrowUpDown,
  Bookmark,
  Handshake,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface WorkedWithPartner {
  id: string;
  full_name: string;
  company_name_ar: string | null;
  company_name_en: string | null;
  avatar_url: string | null;
  logo_url: string | null;
  role: string;
  average_rating: number;
  total_reviews: number;
  city_name_ar: string | null;
  city_name_en: string | null;
  slug_ar: string | null;
  slug_en: string | null;
  deal_count: number;
  total_value: number;
  last_deal_date: string | null;
  my_rating: number | null;
}

interface SavedPartner {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  pipeline_stage: string;
  is_favorite: boolean;
  slug: string | null;
  linked_user_id: string | null;
  linked_role: string | null;
  linked_rating: number | null;
  linked_total_deals: number | null;
  linked_avatar_url: string | null;
  linked_logo_url: string | null;
  linked_city_name_ar: string | null;
  linked_city_name_en: string | null;
  linked_slug_ar: string | null;
  linked_slug_en: string | null;
  tags: Array<{ id: string; name: string; color: string }>;
}

interface Props {
  workedWith: WorkedWithPartner[];
  saved: SavedPartner[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ContractorsSuppliersView({ workedWith, saved }: Props) {
  const t = useTranslations('dashboard.contractorsSuppliers');
  const locale = useLocale();
  const [tab, setTab] = useState<'worked' | 'saved'>('worked');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');

  // ---------------------------------------------------------------------------
  // Worked With — filtered & sorted
  // ---------------------------------------------------------------------------
  const filteredWorkedWith = useMemo(() => {
    let list = [...workedWith];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          (p.company_name_ar || '').toLowerCase().includes(q) ||
          (p.company_name_en || '').toLowerCase().includes(q),
      );
    }

    if (roleFilter) {
      list = list.filter((p) => p.role === roleFilter);
    }

    if (ratingFilter) {
      const min = Number(ratingFilter);
      list = list.filter((p) => p.average_rating >= min);
    }

    // Sort
    const effectiveSort = sortBy || 'deals';
    switch (effectiveSort) {
      case 'deals':
        list.sort((a, b) => b.deal_count - a.deal_count);
        break;
      case 'value':
        list.sort((a, b) => b.total_value - a.total_value);
        break;
      case 'rating':
        list.sort((a, b) => b.average_rating - a.average_rating);
        break;
      case 'recent':
        list.sort((a, b) => {
          if (!a.last_deal_date) return 1;
          if (!b.last_deal_date) return -1;
          return new Date(b.last_deal_date).getTime() - new Date(a.last_deal_date).getTime();
        });
        break;
    }

    return list;
  }, [workedWith, search, roleFilter, ratingFilter, sortBy]);

  // ---------------------------------------------------------------------------
  // Saved — filtered
  // ---------------------------------------------------------------------------
  const filteredSaved = useMemo(() => {
    let list = [...saved];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.company || '').toLowerCase().includes(q),
      );
    }

    if (roleFilter) {
      list = list.filter((p) => p.linked_role === roleFilter);
    }

    return list;
  }, [saved, search, roleFilter]);

  return (
    <div className="space-y-6">
      {/* Override breadcrumb "crm" segment label */}
      <BreadcrumbOverride segment="crm" label={t('title')} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setTab('worked')}
          className={cn(
            'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            tab === 'worked'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Handshake className="me-1.5 inline h-4 w-4" />
          {t('workedWithTab', { count: workedWith.length })}
        </button>
        <button
          onClick={() => setTab('saved')}
          className={cn(
            'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            tab === 'saved'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Bookmark className="me-1.5 inline h-4 w-4" />
          {t('savedTab', { count: saved.length })}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>

        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? '')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('allRoles')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t('allRoles')}</SelectItem>
            <SelectItem value="contractor">{t('contractors')}</SelectItem>
            <SelectItem value="supplier">{t('suppliers')}</SelectItem>
          </SelectContent>
        </Select>

        {tab === 'worked' && (
          <>
            <Select value={ratingFilter} onValueChange={(v) => setRatingFilter(v ?? '')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('allRatings')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('allRatings')}</SelectItem>
                <SelectItem value="4">★ 4+</SelectItem>
                <SelectItem value="3">★ 3+</SelectItem>
                <SelectItem value="2">★ 2+</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v ?? '')}>
              <SelectTrigger className="w-45">
                <ArrowUpDown className="me-1.5 h-3.5 w-3.5" />
                <SelectValue placeholder={t('sortByDeals')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('sortByDeals')}</SelectItem>
                <SelectItem value="value">{t('sortByValue')}</SelectItem>
                <SelectItem value="rating">{t('sortByRating')}</SelectItem>
                <SelectItem value="recent">{t('sortByRecent')}</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Worked With Tab */}
      {tab === 'worked' && (
        <>
          {filteredWorkedWith.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredWorkedWith.map((partner) => {
                const companyName = locale === 'ar'
                  ? (partner.company_name_ar || partner.full_name)
                  : (partner.company_name_en || partner.company_name_ar || partner.full_name);
                const imgUrl = partner.logo_url || partner.avatar_url;
                const profileSlug = locale === 'ar' ? partner.slug_ar : partner.slug_en;
                const cityName = locale === 'ar' ? partner.city_name_ar : partner.city_name_en;

                return (
                  <Card key={partner.id} className="p-5 transition-all hover:border-primary/30 hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <UserAvatar src={imgUrl} name={companyName} size="lg" />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-foreground">{companyName}</h3>
                        {partner.company_name_en && locale === 'ar' && (
                          <p className="truncate text-xs text-muted-foreground" dir="ltr">
                            {partner.company_name_en}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                        <p className="text-lg font-bold text-primary">{partner.deal_count}</p>
                        <p className="text-[10px] text-muted-foreground">{t('dealsCount')}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                        <p className="text-lg font-bold text-primary">{formatSAR(partner.total_value, locale)}</p>
                        <p className="text-[10px] text-muted-foreground">{t('totalValue')}</p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-foreground">
                          {partner.average_rating > 0 ? Number(partner.average_rating).toFixed(1) : '—'}
                        </span>
                        {partner.total_reviews > 0 && (
                          <span>({partner.total_reviews})</span>
                        )}
                      </span>
                      {partner.my_rating && (
                        <span className="flex items-center gap-1">
                          {t('myRating')}: <span className="font-medium text-foreground">{partner.my_rating}/5</span>
                        </span>
                      )}
                    </div>

                    {/* Badges & last deal */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <Badge variant={partner.role === 'contractor' ? 'info' : 'warning'}>
                        {partner.role === 'contractor' ? t('contractors') : t('suppliers')}
                      </Badge>
                      {cityName && <Badge variant="secondary">{cityName}</Badge>}
                    </div>

                    {partner.last_deal_date && (
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        {t('lastDeal')}: {new Date(partner.last_deal_date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                      </p>
                    )}

                    {/* Link to profile */}
                    {profileSlug && (
                      <Link
                        href={`/partners/${profileSlug}`}
                        className="mt-3 block text-center text-xs font-medium text-primary hover:underline"
                      >
                        {t('viewProfile')}
                      </Link>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Handshake className="h-12 w-12" />}
              title={t('noWorkedWith')}
              description={t('noWorkedWithDesc')}
            />
          )}
        </>
      )}

      {/* Saved Tab */}
      {tab === 'saved' && (
        <>
          {filteredSaved.length > 0 ? (
            <div className="space-y-3">
              {filteredSaved.map((client) => {
                const imgUrl = client.linked_logo_url || client.linked_avatar_url;
                const cityName = locale === 'ar' ? client.linked_city_name_ar : client.linked_city_name_en;
                const profileSlug = locale === 'ar' ? client.linked_slug_ar : client.linked_slug_en;

                return (
                  <Link key={client.id} href={`/dashboard/crm/${client.slug || client.id}`}>
                    <Card className="p-4 transition-colors hover:border-primary">
                      <div className="flex items-start gap-3">
                        <UserAvatar src={imgUrl} name={client.name} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {client.is_favorite && <span className="text-warning">★</span>}
                            <h3 className="font-semibold truncate">{client.name}</h3>
                            {client.linked_role && (
                              <Badge variant={client.linked_role === 'contractor' ? 'info' : 'warning'} className="text-[10px]">
                                {client.linked_role === 'contractor' ? t('contractors') : t('suppliers')}
                              </Badge>
                            )}
                          </div>
                          {client.company && (
                            <p className="text-sm text-muted-foreground">{client.company}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {client.tags.map((tag) => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-end shrink-0 space-y-0.5">
                          {client.linked_rating != null && client.linked_rating > 0 && (
                            <span className="flex items-center justify-end gap-1 text-xs">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="font-medium">{Number(client.linked_rating).toFixed(1)}</span>
                            </span>
                          )}
                          {client.linked_total_deals != null && client.linked_total_deals > 0 && (
                            <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                              <Briefcase className="h-3 w-3" />
                              {client.linked_total_deals}
                            </span>
                          )}
                          {cityName && (
                            <p className="text-[10px] text-muted-foreground">{cityName}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Bookmark className="h-12 w-12" />}
              title={t('noSaved')}
              description={t('noSavedDesc')}
            />
          )}
        </>
      )}
    </div>
  );
}
