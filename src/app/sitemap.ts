// =============================================================================
// Muqawil HUB — Dynamic Sitemap Generator
// =============================================================================

import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: Awaited<ReturnType<typeof createClient>>): any {
  return supabase;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://muqawilhub.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  const staticPages = [
    '',
    '/pricing',
    '/marketplace',
    '/projects',
    '/rfqs',
    '/partners',
    '/contact',
    '/terms',
    '/privacy',
    '/cookies',
    '/login',
    '/register',
  ];

  for (const page of staticPages) {
    entries.push({
      url: `${BASE_URL}${page}`,
      lastModified: new Date(),
      changeFrequency: page === '' ? 'daily' : 'weekly',
      priority: page === '' ? 1.0 : 0.7,
    });
  }

  // Dynamic: published projects
  try {
    const supabase = await createClient();
    const { data: projects } = await db(supabase)
      .from('projects')
      .select('id, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (projects) {
      for (const p of projects) {
        entries.push({
          url: `${BASE_URL}/projects/${p.id}`,
          lastModified: new Date(p.updated_at),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }

    // Dynamic: published products
    const { data: products } = await db(supabase)
      .from('products')
      .select('id, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (products) {
      for (const p of products) {
        entries.push({
          url: `${BASE_URL}/products/${p.id}`,
          lastModified: new Date(p.updated_at),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }

    // Dynamic: published RFQs
    const { data: rfqs } = await db(supabase)
      .from('rfqs')
      .select('id, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (rfqs) {
      for (const r of rfqs) {
        entries.push({
          url: `${BASE_URL}/rfqs/${r.id}`,
          lastModified: new Date(r.updated_at),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    }
  } catch {
    // If DB is unavailable, return static pages only
  }

  return entries;
}
