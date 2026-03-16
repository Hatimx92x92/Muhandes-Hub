// =============================================================================
// Muqawil HUB — Typesense DB Webhook Sync
// Called by Supabase Database Webhooks when rows change in:
// projects, products, rfqs, profiles (partners)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getTypesenseClient } from '@/lib/typesense/client';

// Verify the webhook secret to prevent unauthorized calls
function verifyWebhook(request: NextRequest): boolean {
  const secret = request.headers.get('x-webhook-secret');
  return secret === process.env.TYPESENSE_WEBHOOK_SECRET;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
}

// Map DB table to Typesense collection
const TABLE_MAP: Record<string, string> = {
  projects: 'projects',
  products: 'products',
  rfqs: 'rfqs',
  profiles: 'partners',
};

function mapProjectToDoc(record: Record<string, unknown>) {
  return {
    id: String(record.id),
    title_ar: String(record.title_ar || ''),
    title_en: String(record.title_en || ''),
    description_ar: String(record.description_ar || ''),
    description_en: String(record.description_en || ''),
    city: String(record.city || ''),
    category: String(record.category || ''),
    classification: String(record.classification || ''),
    budget_min: Number(record.budget_min || 0),
    budget_max: Number(record.budget_max || 0),
    status: String(record.status || ''),
    owner_name: String(record.owner_name || ''),
    company_name: String(record.company_name || ''),
    bid_count: Number(record.bid_count || 0),
    deadline: record.deadline ? new Date(String(record.deadline)).getTime() : 0,
    created_at: record.created_at ? new Date(String(record.created_at)).getTime() : Date.now(),
    source: String(record.source || ''),
  };
}

function mapProductToDoc(record: Record<string, unknown>) {
  return {
    id: String(record.id),
    title_ar: String(record.title_ar || ''),
    title_en: String(record.title_en || ''),
    description_ar: String(record.description_ar || ''),
    description_en: String(record.description_en || ''),
    category: String(record.category || ''),
    city: String(record.city || ''),
    price: Number(record.price || 0),
    unit: String(record.unit || ''),
    status: String(record.status || ''),
    supplier_name: String(record.supplier_name || ''),
    company_name: String(record.company_name || ''),
    rating: Number(record.rating || 0),
    created_at: record.created_at ? new Date(String(record.created_at)).getTime() : Date.now(),
  };
}

function mapRfqToDoc(record: Record<string, unknown>) {
  return {
    id: String(record.id),
    title_ar: String(record.title_ar || ''),
    title_en: String(record.title_en || ''),
    description_ar: String(record.description_ar || ''),
    description_en: String(record.description_en || ''),
    category: String(record.category || ''),
    city: String(record.city || ''),
    budget_min: Number(record.budget_min || 0),
    budget_max: Number(record.budget_max || 0),
    status: String(record.status || ''),
    requester_name: String(record.requester_name || ''),
    response_count: Number(record.response_count || 0),
    deadline: record.deadline ? new Date(String(record.deadline)).getTime() : 0,
    created_at: record.created_at ? new Date(String(record.created_at)).getTime() : Date.now(),
  };
}

function mapPartnerToDoc(record: Record<string, unknown>) {
  return {
    id: String(record.id),
    full_name: String(record.full_name || ''),
    company_name_ar: String(record.company_name_ar || ''),
    company_name_en: String(record.company_name_en || ''),
    role: String(record.role || ''),
    city: String(record.city || ''),
    bio_ar: String(record.bio_ar || ''),
    bio_en: String(record.bio_en || ''),
    classification: String(record.classification || ''),
    subscription_tier: String(record.subscription_tier || ''),
    average_rating: Number(record.average_rating || 0),
    total_reviews: Number(record.total_reviews || 0),
    total_deals: Number(record.total_deals || 0),
    verification_status: String(record.verification_status || ''),
    created_at: record.created_at ? new Date(String(record.created_at)).getTime() : Date.now(),
  };
}

const MAPPERS: Record<string, (r: Record<string, unknown>) => Record<string, unknown>> = {
  projects: mapProjectToDoc,
  products: mapProductToDoc,
  rfqs: mapRfqToDoc,
  profiles: mapPartnerToDoc,
};

// Only index published posts (and active partners)
function shouldIndex(table: string, record: Record<string, unknown>): boolean {
  if (table === 'profiles') {
    return record.verification_status === 'active';
  }
  return record.status === 'published';
}

export async function POST(request: NextRequest) {
  // 1. Verify webhook authenticity
  if (!verifyWebhook(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Get Typesense client
  const typesense = getTypesenseClient();
  if (!typesense) {
    return NextResponse.json({ error: 'Typesense not configured' }, { status: 503 });
  }

  // 3. Parse payload
  let payload: WebhookPayload;
  try {
    payload = await request.json() as WebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { type, table, record, old_record } = payload;
  const collection = TABLE_MAP[table];
  if (!collection) {
    return NextResponse.json({ error: `Unknown table: ${table}` }, { status: 400 });
  }

  const mapper = MAPPERS[table];
  if (!mapper) {
    return NextResponse.json({ error: `No mapper for: ${table}` }, { status: 400 });
  }

  try {
    if (type === 'DELETE') {
      const id = String((old_record ?? record).id);
      try {
        await typesense.collections(collection).documents(id).delete();
      } catch {
        // Document may not exist in index — ignore
      }
    } else if (type === 'INSERT' || type === 'UPDATE') {
      if (shouldIndex(table, record)) {
        const doc = mapper(record);
        await typesense.collections(collection).documents().upsert(doc);
      } else {
        // If status changed to non-published, remove from index
        const id = String(record.id);
        try {
          await typesense.collections(collection).documents(id).delete();
        } catch {
          // Not in index — ignore
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Typesense sync error:', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
