// =============================================================================
// Muhandes HUB — Dynamic Sitemap Generator
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
      .select('id, slug_ar, slug_en, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (projects) {
      for (const p of projects) {
        const slug = p.slug_ar || p.slug_en || p.id;
        entries.push({
          url: `${BASE_URL}/ar/projects/${slug}`,
          lastModified: new Date(p.updated_at),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
        if (p.slug_en) {
          entries.push({
            url: `${BASE_URL}/en/projects/${p.slug_en}`,
            lastModified: new Date(p.updated_at),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      }
    }

    // Dynamic: published products
    const { data: products } = await db(supabase)
      .from('products')
      .select('id, slug_ar, slug_en, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (products) {
      for (const p of products) {
        const slug = p.slug_ar || p.slug_en || p.id;
        entries.push({
          url: `${BASE_URL}/ar/products/${slug}`,
          lastModified: new Date(p.updated_at),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
        if (p.slug_en) {
          entries.push({
            url: `${BASE_URL}/en/products/${p.slug_en}`,
            lastModified: new Date(p.updated_at),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }
      }
    }

    // Dynamic: published RFQs
    const { data: rfqs } = await db(supabase)
      .from('rfqs')
      .select('id, slug_ar, slug_en, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (rfqs) {
      for (const r of rfqs) {
        const slug = r.slug_ar || r.slug_en || r.id;
        entries.push({
          url: `${BASE_URL}/ar/rfqs/${slug}`,
          lastModified: new Date(r.updated_at),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
        if (r.slug_en) {
          entries.push({
            url: `${BASE_URL}/en/rfqs/${r.slug_en}`,
            lastModified: new Date(r.updated_at),
            changeFrequency: 'weekly',
            priority: 0.6,
          });
        }
      }
    }
  } catch {
    // If DB is unavailable, return static pages only
  }

  return entries;
}
