// =============================================================================
// CRM Pipeline Page — Server Component
// Project owners see Contractors & Suppliers view
// Contractors/Suppliers see classic CRM pipeline
// =============================================================================

import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth-guards';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { CrmAddClientForm } from '@/components/features/crm/crm-add-client-form';
import { PipelineBoard } from '@/components/features/crm/pipeline-board';
import { ContractorsSuppliersView } from '@/components/features/crm/contractors-suppliers-view';
import { TierLimitIndicator } from '@/components/features/tier-gate';
import { TIER_LIMITS } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any { return supabase; }

const PIPELINE_STAGES = [
  { key: 'lead', color: 'text-info' },
  { key: 'in_negotiation', color: 'text-warning' },
  { key: 'active_deal', color: 'text-success' },
  { key: 'completed', color: 'text-primary' },
  { key: 'repeat', color: 'text-accent-purple-foreground' },
] as const;

const STAGE_VARIANTS: Record<string, string> = {
  lead: 'info',
  in_negotiation: 'warning',
  active_deal: 'active',
  completed: 'completed',
  repeat: 'secondary',
};

export default async function CRMPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ stage?: string; q?: string; favorites?: string; archived?: string; view?: string }>;
}) {
  const { locale } = await routeParams;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations('dashboard.crm');
  const tCommon = await getTranslations('dashboard.common');

  // Role guard — buyer excluded from CRM
  const { user, profile, supabase } = await requireRole(['project_owner', 'contractor', 'supplier']);

  // =========================================================================
  // PROJECT OWNER — Show Contractors & Suppliers view
  // =========================================================================
  if (profile.role === 'project_owner') {
    return renderProjectOwnerView(user, supabase, locale);
  }

  // =========================================================================
  // CONTRACTOR / SUPPLIER — Classic CRM pipeline (below)
  // =========================================================================

  // Subscription tier for limit indicator
  const { data: subscription } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const tier = (subscription?.tier || 'starter') as keyof typeof TIER_LIMITS;
  const maxClients = TIER_LIMITS[tier]?.crmClients ?? 20;

  // Fetch all clients
  let query = db(supabase)
    .from('crm_clients')
    .select('*, crm_client_tags(tag_id, crm_tags(id, name, color))')
    .eq('owner_id', user.id)
    .order('last_interaction_at', { ascending: false });

  if (sp.stage) {
    query = query.eq('pipeline_stage', sp.stage);
  }
  if (sp.favorites === 'true') {
    query = query.eq('is_favorite', true);
  }
  if (sp.archived === 'true') {
    query = query.eq('is_archived', true);
  } else {
    query = query.eq('is_archived', false);
  }
  if (sp.q) {
    query = query.or(`name.ilike.%${sp.q}%,company.ilike.%${sp.q}%,email.ilike.%${sp.q}%`);
  }

  const { data: clients } = await query;

  // Fetch user tags
  const { data: tags } = await db(supabase)
    .from('crm_tags')
    .select('*')
    .eq('owner_id', user.id)
    .order('name');

  // Stage counts
  const stageCounts: Record<string, number> = {};
  for (const stage of PIPELINE_STAGES) {
    stageCounts[stage.key] = (clients || []).filter(
      (c: Record<string, unknown>) => c.pipeline_stage === stage.key
    ).length;
  }
  const totalClients = (clients || []).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={
          <span>
            {t('clientCount', { count: totalClients })}
            {' · '}
            <TierLimitIndicator current={totalClients} max={maxClients} />
          </span>
        }
        action={<CrmAddClientForm tags={tags || []} />}
      />

      {/* Pipeline Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {PIPELINE_STAGES.map(stage => (
          <Link
            key={stage.key}
            href={sp.stage === stage.key ? '/dashboard/crm' : `/dashboard/crm?stage=${stage.key}`}
          >
            <Card className={`p-3 text-center transition-colors hover:border-primary ${sp.stage === stage.key ? 'border-primary bg-primary/5' : ''}`}>
              <p className={`text-2xl font-bold ${stage.color}`}>{stageCounts[stage.key] || 0}</p>
              <p className="text-xs text-muted-foreground">{t(`stage.${stage.key}`)}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/dashboard/crm">
          <Badge variant={!sp.stage && !sp.favorites && !sp.archived ? 'default' : 'outline'}>
            {tCommon('all')}
          </Badge>
        </Link>
        <Link href="/dashboard/crm?favorites=true">
          <Badge variant={sp.favorites === 'true' ? 'warning' : 'outline'}>
            ★ {t('favorites')}
          </Badge>
        </Link>
        <Link href="/dashboard/crm?archived=true">
          <Badge variant={sp.archived === 'true' ? 'secondary' : 'outline'}>
            {t('archived')}
          </Badge>
        </Link>

        {/* View Toggle */}
        <div className="ms-auto flex gap-1">
          <Link href={`/dashboard/crm?${new URLSearchParams({ ...sp, view: 'board' }).toString()}`}>
            <Badge variant={sp.view !== 'list' ? 'default' : 'outline'}>
              {t('boardView')}
            </Badge>
          </Link>
          <Link href={`/dashboard/crm?${new URLSearchParams({ ...sp, view: 'list' }).toString()}`}>
            <Badge variant={sp.view === 'list' ? 'default' : 'outline'}>
              {t('listView')}
            </Badge>
          </Link>
        </div>
      </div>

      {/* Pipeline Board View (default) */}
      {sp.view !== 'list' && !sp.stage && !sp.favorites && !sp.archived && (
        <PipelineBoard
          clients={(clients || []).map((c: Record<string, unknown>) => ({
            id: c.id as string,
            name: c.name as string,
            company: c.company as string | null,
            email: c.email as string | null,
            phone: c.phone as string | null,
            pipeline_stage: c.pipeline_stage as string,
            is_favorite: c.is_favorite as boolean,
            last_interaction_at: c.last_interaction_at as string | null,
            slug: c.slug as string | null,
            crm_client_tags: (c.crm_client_tags as Array<Record<string, unknown>> || []).map((ct) => ({
              crm_tags: ct.crm_tags as { id: string; name: string; color: string } | null,
            })),
          }))}
          stages={PIPELINE_STAGES.map(s => ({ key: s.key, color: s.color }))}
        />
      )}

      {/* Client List View */}
      {(sp.view === 'list' || sp.stage || sp.favorites || sp.archived) && (
        <>
      {(clients && clients.length > 0) ? (
        <div className="space-y-3">
          {clients.map((client: Record<string, unknown>) => {
            const clientTags = (client.crm_client_tags as Array<Record<string, unknown>>) || [];
            const stageInfo = PIPELINE_STAGES.find(s => s.key === client.pipeline_stage);
            return (
              <Link key={client.id as string} href={`/dashboard/crm/${(client.slug as string) || client.id}`}>
                <Card className="p-4 hover:border-primary transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {!!client.is_favorite && <span className="text-warning">★</span>}
                        <h3 className="font-semibold truncate">{client.name as string}</h3>
                        {stageInfo && (
                          <Badge variant={STAGE_VARIANTS[stageInfo.key] as 'info' | 'warning' | 'active' | 'completed' | 'secondary'}>
                            {t(`stage.${stageInfo.key}`)}
                          </Badge>
                        )}
                      </div>
                      {!!client.company && (
                        <p className="text-sm text-muted-foreground">{client.company as string}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {clientTags.map((ct: Record<string, unknown>) => {
                          const tag = ct.crm_tags as Record<string, unknown> | null;
                          if (!tag) return null;
                          return (
                            <span
                              key={tag.id as string}
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{ backgroundColor: `${tag.color as string}20`, color: tag.color as string }}
                            >
                              {tag.name as string}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      {!!client.email && (
                        <p className="text-xs text-muted-foreground">{client.email as string}</p>
                      )}
                      {!!client.phone && (
                        <p className="text-xs text-muted-foreground">{client.phone as string}</p>
                      )}
                      <p className={`text-[10px] mt-1 ${(() => {
                        if (!client.last_interaction_at) return 'text-muted-foreground';
                        const days = Math.floor((Date.now() - new Date(client.last_interaction_at as string).getTime()) / 86400000);
                        if (days < 30) return 'text-success';
                        if (days < 90) return 'text-warning';
                        return 'text-destructive';
                      })()}`}>
                        {t('lastInteraction')}: {client.last_interaction_at
                          ? new Date(client.last_interaction_at as string).toLocaleDateString(locale)
                          : '—'}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">{t('noClients')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('noClientsDesc')}</p>
        </Card>
      )}
        </>
      )}
    </div>
  );
}

// =============================================================================
// Project Owner — Contractors & Suppliers view
// Fetches "worked with" from completed deals + "saved" from CRM clients
// =============================================================================
async function renderProjectOwnerView(
  user: { id: string },
  supabase: Awaited<ReturnType<typeof createClient>>,
  locale: string,
) {
  // 1. Fetch completed deals where this user is the buyer
  const { data: deals } = await db(supabase)
    .from('deals')
    .select(`
      id,
      value,
      completed_at,
      seller_id,
      seller:profiles!deals_seller_id_fkey (
        id, full_name, company_name_ar, company_name_en,
        avatar_url, logo_url, role, average_rating, total_reviews,
        slug_ar, slug_en,
        saudi_cities ( name_ar, name_en )
      )
    `)
    .eq('buyer_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false });

  // 2. Fetch reviews left by this user (to get "my rating")
  const { data: myReviews } = await db(supabase)
    .from('reviews')
    .select('reviewee_id, overall_rating')
    .eq('reviewer_id', user.id);

  const myRatingMap = new Map<string, number>();
  for (const r of myReviews || []) {
    myRatingMap.set(r.reviewee_id, r.overall_rating);
  }

  // 3. Aggregate deals per seller
  const sellerMap = new Map<string, {
    seller: Record<string, unknown>;
    deal_count: number;
    total_value: number;
    last_deal_date: string | null;
  }>();

  for (const deal of deals || []) {
    if (!deal.seller) continue;
    const sid = (deal.seller as Record<string, unknown>).id as string;
    const existing = sellerMap.get(sid);
    if (existing) {
      existing.deal_count += 1;
      existing.total_value += Number(deal.value || 0);
      if (deal.completed_at && (!existing.last_deal_date || deal.completed_at > existing.last_deal_date)) {
        existing.last_deal_date = deal.completed_at;
      }
    } else {
      sellerMap.set(sid, {
        seller: deal.seller as Record<string, unknown>,
        deal_count: 1,
        total_value: Number(deal.value || 0),
        last_deal_date: deal.completed_at,
      });
    }
  }

  const workedWith = Array.from(sellerMap.values()).map(({ seller, deal_count, total_value, last_deal_date }) => {
    const city = seller.saudi_cities as Record<string, string> | null;
    return {
      id: seller.id as string,
      full_name: seller.full_name as string,
      company_name_ar: seller.company_name_ar as string | null,
      company_name_en: seller.company_name_en as string | null,
      avatar_url: seller.avatar_url as string | null,
      logo_url: seller.logo_url as string | null,
      role: seller.role as string,
      average_rating: Number(seller.average_rating || 0),
      total_reviews: Number(seller.total_reviews || 0),
      city_name_ar: city?.name_ar ?? null,
      city_name_en: city?.name_en ?? null,
      slug_ar: seller.slug_ar as string | null,
      slug_en: seller.slug_en as string | null,
      deal_count,
      total_value,
      last_deal_date,
      my_rating: myRatingMap.get(seller.id as string) ?? null,
    };
  });

  // 4. Fetch saved CRM clients (filtered to contractor/supplier linked users)
  const { data: crmClients } = await db(supabase)
    .from('crm_clients')
    .select(`
      id, name, company, email, phone, pipeline_stage, is_favorite, linked_user_id,
      crm_client_tags ( tag_id, crm_tags ( id, name, color ) ),
      linked_user:profiles!crm_clients_linked_user_id_fkey (
        role, average_rating, total_deals, avatar_url, logo_url,
        slug_ar, slug_en,
        saudi_cities ( name_ar, name_en )
      )
    `)
    .eq('owner_id', user.id)
    .eq('is_archived', false)
    .order('is_favorite', { ascending: false })
    .order('last_interaction_at', { ascending: false });

  const saved = (crmClients || [])
    .filter((c: Record<string, unknown>) => {
      // Show all saved clients, but enrich linked ones with role data
      const linked = c.linked_user as Record<string, unknown> | null;
      if (linked && !['contractor', 'supplier'].includes(linked.role as string)) return false;
      return true;
    })
    .map((c: Record<string, unknown>) => {
      const linked = c.linked_user as Record<string, unknown> | null;
      const city = linked?.saudi_cities as Record<string, string> | null;
      const clientTags = (c.crm_client_tags as Array<Record<string, unknown>> || [])
        .map((ct) => ct.crm_tags as { id: string; name: string; color: string })
        .filter(Boolean);

      return {
        id: c.id as string,
        name: c.name as string,
        company: c.company as string | null,
        email: c.email as string | null,
        phone: c.phone as string | null,
        pipeline_stage: c.pipeline_stage as string,
        is_favorite: c.is_favorite as boolean,
        linked_user_id: c.linked_user_id as string | null,
        linked_role: (linked?.role as string) ?? null,
        linked_rating: linked ? Number(linked.average_rating || 0) : null,
        linked_total_deals: linked ? Number(linked.total_deals || 0) : null,
        linked_avatar_url: (linked?.avatar_url as string) ?? null,
        linked_logo_url: (linked?.logo_url as string) ?? null,
        linked_city_name_ar: city?.name_ar ?? null,
        linked_city_name_en: city?.name_en ?? null,
        linked_slug_ar: (linked?.slug_ar as string) ?? null,
        linked_slug_en: (linked?.slug_en as string) ?? null,
        tags: clientTags,
      };
    });

  // 5. Fetch tags for the Add Client form
  const { data: tags } = await db(supabase)
    .from('crm_tags')
    .select('*')
    .eq('owner_id', user.id)
    .order('name');

  const t = await getTranslations('dashboard.crm');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        action={<CrmAddClientForm tags={tags || []} />}
      />
      <ContractorsSuppliersView workedWith={workedWith} saved={saved} />
    </div>
  );
}
