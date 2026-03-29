// =============================================================================
// Muhandes HUB — Typesense Index Schemas
// 4 indexes: projects, products, rfqs, partners
// =============================================================================

import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';

// ---------------------------------------------------------------------------
// Projects Index
// ---------------------------------------------------------------------------
export const projectsSchema: CollectionCreateSchema = {
  name: 'projects',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'title_ar', type: 'string', locale: 'ar' },
    { name: 'title_en', type: 'string', locale: 'en' },
    { name: 'description_ar', type: 'string', locale: 'ar', optional: true },
    { name: 'description_en', type: 'string', locale: 'en', optional: true },
    { name: 'city', type: 'string', facet: true },
    { name: 'category', type: 'string', facet: true, optional: true },
    { name: 'classification', type: 'string', facet: true, optional: true },
    { name: 'budget_min', type: 'float', optional: true },
    { name: 'budget_max', type: 'float', optional: true },
    { name: 'status', type: 'string', facet: true },
    { name: 'owner_name', type: 'string', optional: true },
    { name: 'company_name', type: 'string', optional: true },
    { name: 'bid_count', type: 'int32', optional: true },
    { name: 'deadline', type: 'int64', optional: true },
    { name: 'created_at', type: 'int64' },
    { name: 'source', type: 'string', facet: true, optional: true },
  ],
  default_sorting_field: 'created_at',
  token_separators: ['-', '_'],
};

// ---------------------------------------------------------------------------
// Products Index
// ---------------------------------------------------------------------------
export const productsSchema: CollectionCreateSchema = {
  name: 'products',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'title_ar', type: 'string', locale: 'ar' },
    { name: 'title_en', type: 'string', locale: 'en' },
    { name: 'description_ar', type: 'string', locale: 'ar', optional: true },
    { name: 'description_en', type: 'string', locale: 'en', optional: true },
    { name: 'category', type: 'string', facet: true, optional: true },
    { name: 'city', type: 'string', facet: true, optional: true },
    { name: 'price', type: 'float', optional: true },
    { name: 'unit', type: 'string', optional: true },
    { name: 'status', type: 'string', facet: true },
    { name: 'supplier_name', type: 'string', optional: true },
    { name: 'company_name', type: 'string', optional: true },
    { name: 'rating', type: 'float', optional: true },
    { name: 'created_at', type: 'int64' },
  ],
  default_sorting_field: 'created_at',
  token_separators: ['-', '_'],
};

// ---------------------------------------------------------------------------
// RFQs Index
// ---------------------------------------------------------------------------
export const rfqsSchema: CollectionCreateSchema = {
  name: 'rfqs',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'title_ar', type: 'string', locale: 'ar' },
    { name: 'title_en', type: 'string', locale: 'en' },
    { name: 'description_ar', type: 'string', locale: 'ar', optional: true },
    { name: 'description_en', type: 'string', locale: 'en', optional: true },
    { name: 'category', type: 'string', facet: true, optional: true },
    { name: 'city', type: 'string', facet: true, optional: true },
    { name: 'budget_min', type: 'float', optional: true },
    { name: 'budget_max', type: 'float', optional: true },
    { name: 'status', type: 'string', facet: true },
    { name: 'requester_name', type: 'string', optional: true },
    { name: 'response_count', type: 'int32', optional: true },
    { name: 'deadline', type: 'int64', optional: true },
    { name: 'created_at', type: 'int64' },
  ],
  default_sorting_field: 'created_at',
  token_separators: ['-', '_'],
};

// ---------------------------------------------------------------------------
// Partners Index (profiles searchable as partners)
// ---------------------------------------------------------------------------
export const partnersSchema: CollectionCreateSchema = {
  name: 'partners',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'full_name', type: 'string' },
    { name: 'company_name_ar', type: 'string', locale: 'ar', optional: true },
    { name: 'company_name_en', type: 'string', locale: 'en', optional: true },
    { name: 'role', type: 'string', facet: true },
    { name: 'city', type: 'string', facet: true, optional: true },
    { name: 'bio_ar', type: 'string', locale: 'ar', optional: true },
    { name: 'bio_en', type: 'string', locale: 'en', optional: true },
    { name: 'classification', type: 'string', facet: true, optional: true },
    { name: 'subscription_tier', type: 'string', facet: true, optional: true },
    { name: 'average_rating', type: 'float', optional: true },
    { name: 'total_reviews', type: 'int32', optional: true },
    { name: 'total_deals', type: 'int32', optional: true },
    { name: 'verification_status', type: 'string', facet: true },
    { name: 'created_at', type: 'int64' },
  ],
  default_sorting_field: 'created_at',
  token_separators: ['-', '_'],
};

// ---------------------------------------------------------------------------
// Search weights configuration
// title 3×, company/name 2×, description 1×
// ---------------------------------------------------------------------------
export const SEARCH_WEIGHTS = {
  projects: {
    query_by: 'title_ar,title_en,company_name,owner_name,description_ar,description_en',
    query_by_weights: '3,3,2,2,1,1',
  },
  products: {
    query_by: 'title_ar,title_en,company_name,supplier_name,description_ar,description_en',
    query_by_weights: '3,3,2,2,1,1',
  },
  rfqs: {
    query_by: 'title_ar,title_en,requester_name,description_ar,description_en',
    query_by_weights: '3,3,2,1,1',
  },
  partners: {
    query_by: 'full_name,company_name_ar,company_name_en,bio_ar,bio_en',
    query_by_weights: '3,2,2,1,1',
  },
} as const;

// ---------------------------------------------------------------------------
// All schemas for initialization
// ---------------------------------------------------------------------------
export const ALL_SCHEMAS = [projectsSchema, productsSchema, rfqsSchema, partnersSchema];
