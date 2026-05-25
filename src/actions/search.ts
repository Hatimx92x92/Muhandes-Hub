// =============================================================================
// Muhandes HUB — Search Server Action (Typesense + PostgreSQL fallback)
// =============================================================================

'use server';

import { headers } from 'next/headers';
import { getTypesenseClient } from '@/lib/typesense/client';
import { SEARCH_WEIGHTS } from '@/lib/typesense/schemas';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { searchLimiter, checkRateLimit } from '@/lib/rate-limit';
import type { ActionResult } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: Awaited<ReturnType<typeof createClient>>): any {
  return supabase;
}

export interface SearchParams {
  query: string;
  collection: 'projects' | 'products' | 'rfqs' | 'partners';
  page?: number;
  perPage?: number;
  filters?: Record<string, string>;
  sortBy?: string;
}

export interface SearchResult {
  id: string;
  [key: string]: unknown;
}

export interface SearchResponse {
  hits: SearchResult[];
  totalFound: number;
  page: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// SEARCH — Typesense with PostgreSQL fallback
// ---------------------------------------------------------------------------

export async function search(
  params: SearchParams,
): Promise<ActionResult<SearchResponse>> {
  const t = await getTranslations('actions.search');
  const { query, collection, page = 1, perPage = 20, filters, sortBy } = params;

  // Rate limit (120/min per IP)
  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
  const rl = await checkRateLimit(searchLimiter(), `search:${ip}`);
  if (!rl.success) {
    return { data: null, error: t('tooManyRequests') };
  }

  // Try Typesense first
  const typesense = getTypesenseClient();
  if (typesense) {
    try {
      return await typesenseSearch(typesense, params);
    } catch {
      // Fall through to PostgreSQL
    }
  }

  // PostgreSQL fallback
  return await postgresSearch(params);
}

// ---------------------------------------------------------------------------
// Typesense search implementation
// ---------------------------------------------------------------------------

async function typesenseSearch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  params: SearchParams,
): Promise<ActionResult<SearchResponse>> {
  const { query, collection, page = 1, perPage = 20, filters, sortBy } = params;
  const weights = SEARCH_WEIGHTS[collection];

  // Build filter string
  let filterBy = '';
  if (collection !== 'partners') {
    filterBy = 'status:published';
  } else {
    filterBy = 'verification_status:active';
  }

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        filterBy += filterBy ? ` && ${key}:${value}` : `${key}:${value}`;
      }
    }
  }

  const searchParams = {
    q: query || '*',
    query_by: weights.query_by,
    query_by_weights: weights.query_by_weights,
    filter_by: filterBy || undefined,
    sort_by: sortBy || 'created_at:desc',
    page,
    per_page: perPage,
    num_typos: 2,
    typo_tokens_threshold: 1,
  };

  const result = await client.collections(collection).documents().search(searchParams);

  const hits: SearchResult[] = (result.hits || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (hit: any) => ({ ...hit.document, _score: hit.text_match }),
  );

  return {
    data: {
      hits,
      totalFound: result.found || 0,
      page,
      totalPages: Math.ceil((result.found || 0) / perPage),
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// PostgreSQL fallback search (pg_trgm + to_tsvector)
// ---------------------------------------------------------------------------

async function postgresSearch(
  params: SearchParams,
): Promise<ActionResult<SearchResponse>> {
  const t = await getTranslations('actions.search');
  const { query, collection, page = 1, perPage = 20, filters, sortBy } = params;
  const supabase = await createClient();

  const tableMap: Record<string, string> = {
    projects: 'projects',
    products: 'products',
    rfqs: 'rfqs',
    partners: 'profiles',
  };
  const table = tableMap[collection];
  if (!table) return { data: null, error: t('invalidCollection') };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let queryBuilder = db(supabase).from(table).select('id', { count: 'exact' });

  // Status filter
  if (collection !== 'partners') {
    queryBuilder = queryBuilder.eq('status', 'published');
  } else {
    queryBuilder = queryBuilder.eq('verification_status', 'active');
  }

  // Text search using ilike (basic fallback)
  if (query && query !== '*') {
    const searchPattern = `%${query}%`;
    if (collection === 'partners') {
      queryBuilder = queryBuilder.or(
        `full_name.ilike.${searchPattern},company_name_ar.ilike.${searchPattern},company_name_en.ilike.${searchPattern}`,
      );
    } else {
      queryBuilder = queryBuilder.or(
        `title_ar.ilike.${searchPattern},title_en.ilike.${searchPattern}`,
      );
    }
  }

  // Facet filters
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value && key !== 'status' && key !== 'verification_status') {
        queryBuilder = queryBuilder.eq(key, value);
      }
    }
  }

  // Sorting
  if (sortBy) {
    const [field, direction] = sortBy.split(':');
    queryBuilder = queryBuilder.order(field, { ascending: direction === 'asc' });
  } else {
    queryBuilder = queryBuilder.order('created_at', { ascending: false });
  }

  // Pagination
  const from = (page - 1) * perPage;
  queryBuilder = queryBuilder.range(from, from + perPage - 1);

  const { data, count, error } = await queryBuilder;

  if (error) {
    return { data: null, error: t('searchError') };
  }

  return {
    data: {
      hits: (data || []).map((row: Record<string, unknown>) => ({
        id: String(row.id),
        ...row,
      })),
      totalFound: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / perPage),
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// GLOBAL SEARCH — Dashboard command palette (Cmd+K)
// Searches across deals, projects, products, CRM clients, contracts, conversations
// ---------------------------------------------------------------------------

export interface GlobalSearchResult {
  id: string;
  type: 'deal' | 'project' | 'product' | 'crm_client' | 'contract' | 'conversation' | 'admin_user' | 'admin_post';
  title: string;
  subtitle?: string;
  href: string;
}

export async function globalSearch(
  query: string,
  options?: { isAdmin?: boolean },
): Promise<ActionResult<GlobalSearchResult[]>> {
  const t = await getTranslations('actions.search');

  if (!query || query.trim().length < 2) {
    return { data: [], error: null };
  }

  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Rate limit
  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
  const rl = await checkRateLimit(searchLimiter(), `global:${ip}`);
  if (!rl.success) return { data: null, error: t('tooManyRequests') };

  const pattern = `%${query.replace(/[%_]/g, '')}%`;
  const userId = user.id;

  // Parallel searches across user's entities
  const searches = [
    // Deals
    db(supabase)
      .from('deals')
      .select('id, title_slug, deal_type, status')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .or(`title_slug.ilike.${pattern}`)
      .limit(5),

    // Projects
    db(supabase)
      .from('projects')
      .select('id, title_ar, title_en, status')
      .eq('owner_id', userId)
      .or(`title_ar.ilike.${pattern},title_en.ilike.${pattern}`)
      .limit(5),

    // Products
    db(supabase)
      .from('products')
      .select('id, name_ar, name_en, status')
      .eq('supplier_id', userId)
      .or(`name_ar.ilike.${pattern},name_en.ilike.${pattern}`)
      .limit(5),

    // CRM Clients
    db(supabase)
      .from('crm_clients')
      .select('id, name, company')
      .eq('owner_id', userId)
      .or(`name.ilike.${pattern},company.ilike.${pattern}`)
      .limit(5),

    // Contracts
    db(supabase)
      .from('contracts')
      .select('id, deal_id, title_ar, title_en')
      .or(`title_ar.ilike.${pattern},title_en.ilike.${pattern}`)
      .limit(5),
  ];

  const [deals, projects, products, clients, contracts] = await Promise.all(searches);

  const results: GlobalSearchResult[] = [];

  // Map deals
  for (const d of deals.data ?? []) {
    results.push({
      id: d.id,
      type: 'deal',
      title: d.title_slug ?? `Deal`,
      subtitle: d.status,
      href: `/dashboard/deals/${d.id}`,
    });
  }

  // Map projects
  for (const p of projects.data ?? []) {
    results.push({
      id: p.id,
      type: 'project',
      title: p.title_en || p.title_ar || 'Project',
      subtitle: p.status,
      href: `/dashboard/projects/${p.id}`,
    });
  }

  // Map products
  for (const p of products.data ?? []) {
    results.push({
      id: p.id,
      type: 'product',
      title: p.name_en || p.name_ar || 'Product',
      subtitle: p.status,
      href: `/dashboard/products/${p.id}`,
    });
  }

  // Map CRM clients
  for (const c of clients.data ?? []) {
    results.push({
      id: c.id,
      type: 'crm_client',
      title: c.name ?? 'Client',
      subtitle: c.company,
      href: `/dashboard/crm/${c.id}`,
    });
  }

  // Map contracts
  for (const c of contracts.data ?? []) {
    results.push({
      id: c.id,
      type: 'contract',
      title: c.title_en || c.title_ar || 'Contract',
      href: `/dashboard/deals/${c.deal_id}/contract`,
    });
  }

  // Admin-only searches
  if (options?.isAdmin) {
    const adminSearches = [
      db(supabase)
        .from('profiles')
        .select('id, full_name, company_name_en, role')
        .or(`full_name.ilike.${pattern},company_name_en.ilike.${pattern},company_name_ar.ilike.${pattern}`)
        .limit(5),
    ];

    const [adminUsers] = await Promise.all(adminSearches);

    for (const u of adminUsers.data ?? []) {
      results.push({
        id: u.id,
        type: 'admin_user',
        title: u.full_name ?? 'User',
        subtitle: u.role,
        href: `/admin/users/${u.id}`,
      });
    }
  }

  return { data: results, error: null };
}
