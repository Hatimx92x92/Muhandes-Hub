// =============================================================================
// Typesense Initial Data Indexing Script
// Usage: npx tsx scripts/typesense-index.ts
// =============================================================================

import Typesense from 'typesense';
import { createClient } from '@supabase/supabase-js';
import {
  ALL_SCHEMAS,
  projectsSchema,
  productsSchema,
  rfqsSchema,
  partnersSchema,
} from '../src/lib/typesense/schemas';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TYPESENSE_HOST = process.env.TYPESENSE_HOST;
const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY;
const TYPESENSE_PORT = Number(process.env.TYPESENSE_PORT || '443');
const TYPESENSE_PROTOCOL = process.env.TYPESENSE_PROTOCOL || 'https';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}
if (!TYPESENSE_HOST || !TYPESENSE_API_KEY) {
  console.error('Missing TYPESENSE env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const typesense = new Typesense.Client({
  nodes: [{ host: TYPESENSE_HOST, port: TYPESENSE_PORT, protocol: TYPESENSE_PROTOCOL }],
  apiKey: TYPESENSE_API_KEY,
  connectionTimeoutSeconds: 10,
});

// ---------------------------------------------------------------------------
// Helper: paginate Supabase query
// ---------------------------------------------------------------------------
async function fetchAll(table: string, select: string, filters?: Record<string, string>) {
  const pageSize = 1000;
  let allData: Record<string, unknown>[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase.from(table).select(select).range(from, from + pageSize - 1);
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
    }
    const { data, error } = await query;
    if (error) throw new Error(`Fetch ${table} error: ${error.message}`);
    if (!data || data.length === 0) break;
    allData = allData.concat(data as unknown as Record<string, unknown>[]);
    hasMore = data.length === pageSize;
    from += pageSize;
  }

  return allData;
}

// ---------------------------------------------------------------------------
// Create or recreate collections
// ---------------------------------------------------------------------------
async function setupCollections(forceRecreate: boolean) {
  for (const schema of ALL_SCHEMAS) {
    try {
      if (forceRecreate) {
        try {
          await typesense.collections(schema.name).delete();
          console.log(`  Deleted existing collection: ${schema.name}`);
        } catch {
          // Collection doesn't exist
        }
      }
      await typesense.collections().create(schema);
      console.log(`  Created collection: ${schema.name}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('already exists')) {
        console.log(`  Collection already exists: ${schema.name}`);
      } else {
        throw e;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Index data
// ---------------------------------------------------------------------------
async function indexProjects() {
  console.log('\nIndexing projects...');
  const projects = await fetchAll(
    'projects',
    'id, title_ar, title_en, description_ar, description_en, city, category, classification, budget_min, budget_max, status, bid_count, source, created_at, owner_id',
    { status: 'published' },
  );

  // Fetch owner names
  const ownerIds = [...new Set(projects.map((p) => p.owner_id as string))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, company_name_ar')
    .in('id', ownerIds);
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  const documents = projects.map((p) => {
    const owner = profileMap.get(p.owner_id as string);
    return {
      id: p.id as string,
      title_ar: p.title_ar || '',
      title_en: p.title_en || '',
      description_ar: p.description_ar || '',
      description_en: p.description_en || '',
      city: p.city || '',
      category: p.category || '',
      classification: p.classification || '',
      budget_min: Number(p.budget_min) || 0,
      budget_max: Number(p.budget_max) || 0,
      status: 'published',
      owner_name: owner?.full_name || '',
      company_name: owner?.company_name_ar || '',
      bid_count: Number(p.bid_count) || 0,
      source: p.source || '',
      created_at: new Date(p.created_at as string).getTime(),
    };
  });

  if (documents.length > 0) {
    const result = await typesense.collections('projects').documents().import(documents, { action: 'upsert' });
    const failures = result.filter((r) => !r.success);
    console.log(`  Indexed ${documents.length - failures.length}/${documents.length} projects`);
    if (failures.length > 0) console.log(`  Failed: ${failures.length}`, failures.slice(0, 3));
  } else {
    console.log('  No published projects to index');
  }
}

async function indexProducts() {
  console.log('\nIndexing products...');
  const products = await fetchAll(
    'products',
    'id, name_ar, name_en, description_ar, description_en, category, city, price, unit, status, supplier_id, created_at',
    { status: 'published' },
  );

  const supplierIds = [...new Set(products.map((p) => p.supplier_id as string))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, company_name_ar')
    .in('id', supplierIds);
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  const documents = products.map((p) => {
    const supplier = profileMap.get(p.supplier_id as string);
    return {
      id: p.id as string,
      title_ar: (p.name_ar || '') as string,
      title_en: (p.name_en || '') as string,
      description_ar: p.description_ar || '',
      description_en: p.description_en || '',
      category: p.category || '',
      city: p.city || '',
      price: Number(p.price) || 0,
      unit: p.unit || '',
      status: 'published',
      supplier_name: supplier?.full_name || '',
      company_name: supplier?.company_name_ar || '',
      created_at: new Date(p.created_at as string).getTime(),
    };
  });

  if (documents.length > 0) {
    const result = await typesense.collections('products').documents().import(documents, { action: 'upsert' });
    const failures = result.filter((r) => !r.success);
    console.log(`  Indexed ${documents.length - failures.length}/${documents.length} products`);
    if (failures.length > 0) console.log(`  Failed: ${failures.length}`, failures.slice(0, 3));
  } else {
    console.log('  No published products to index');
  }
}

async function indexRFQs() {
  console.log('\nIndexing RFQs...');
  const rfqs = await fetchAll(
    'rfqs',
    'id, title_ar, title_en, description_ar, description_en, category, city, budget_min, budget_max, status, creator_id, response_count, deadline, created_at',
    { status: 'published' },
  );

  const creatorIds = [...new Set(rfqs.map((r) => r.creator_id as string))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', creatorIds);
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  const documents = rfqs.map((r) => {
    const creator = profileMap.get(r.creator_id as string);
    return {
      id: r.id as string,
      title_ar: r.title_ar || '',
      title_en: r.title_en || '',
      description_ar: r.description_ar || '',
      description_en: r.description_en || '',
      category: r.category || '',
      city: r.city || '',
      budget_min: Number(r.budget_min) || 0,
      budget_max: Number(r.budget_max) || 0,
      status: 'published',
      requester_name: creator?.full_name || '',
      response_count: Number(r.response_count) || 0,
      deadline: r.deadline ? new Date(r.deadline as string).getTime() : 0,
      created_at: new Date(r.created_at as string).getTime(),
    };
  });

  if (documents.length > 0) {
    const result = await typesense.collections('rfqs').documents().import(documents, { action: 'upsert' });
    const failures = result.filter((r) => !r.success);
    console.log(`  Indexed ${documents.length - failures.length}/${documents.length} RFQs`);
    if (failures.length > 0) console.log(`  Failed: ${failures.length}`, failures.slice(0, 3));
  } else {
    console.log('  No published RFQs to index');
  }
}

async function indexPartners() {
  console.log('\nIndexing partners...');
  const partners = await fetchAll(
    'profiles',
    'id, full_name, company_name_ar, company_name_en, role, city, bio_ar, bio_en, classification, tier, average_rating, total_reviews, total_deals, verification_status, created_at',
    { verification_status: 'active' },
  );

  const documents = partners.map((p) => ({
    id: p.id as string,
    full_name: p.full_name || '',
    company_name_ar: p.company_name_ar || '',
    company_name_en: p.company_name_en || '',
    role: p.role || '',
    city: p.city || '',
    bio_ar: p.bio_ar || '',
    bio_en: p.bio_en || '',
    classification: p.classification || '',
    subscription_tier: p.tier || 'starter',
    average_rating: Number(p.average_rating) || 0,
    total_reviews: Number(p.total_reviews) || 0,
    total_deals: Number(p.total_deals) || 0,
    verification_status: 'active',
    created_at: new Date(p.created_at as string).getTime(),
  }));

  if (documents.length > 0) {
    const result = await typesense.collections('partners').documents().import(documents, { action: 'upsert' });
    const failures = result.filter((r) => !r.success);
    console.log(`  Indexed ${documents.length - failures.length}/${documents.length} partners`);
    if (failures.length > 0) console.log(`  Failed: ${failures.length}`, failures.slice(0, 3));
  } else {
    console.log('  No active partners to index');
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const forceRecreate = process.argv.includes('--force');

  console.log('=== Muqawil HUB — Typesense Indexing ===');
  console.log(`Typesense: ${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}`);
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`Force recreate: ${forceRecreate}\n`);

  console.log('Setting up collections...');
  await setupCollections(forceRecreate);

  await indexProjects();
  await indexProducts();
  await indexRFQs();
  await indexPartners();

  console.log('\n=== Indexing complete ===');
}

main().catch((err) => {
  console.error('Indexing failed:', err);
  process.exit(1);
});
