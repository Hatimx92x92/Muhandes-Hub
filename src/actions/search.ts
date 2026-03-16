// =============================================================================
// Muqawil HUB — Search Server Action (Typesense + PostgreSQL fallback)
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
  let queryBuilder = db(supabase).from(table).select('*', { count: 'exact' });

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
