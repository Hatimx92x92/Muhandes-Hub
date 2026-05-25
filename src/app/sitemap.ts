// =============================================================================
// Muhandes HUB — Dynamic Sitemap Generator
// =============================================================================

import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: Awaited<ReturnType<typeof createClient>>): any {
  return supabase;
}

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://muhandeshub.com').trim();

// Use build date for static pages instead of new Date() on every request.
// Changing on every crawl signals false freshness to Google.
const STATIC_LAST_MODIFIED = new Date('2026-04-06');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages — both locales with hreflang alternates
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
    '/refund-policy',
    '/login',
    '/register',
  ];

  for (const page of staticPages) {
    entries.push({
      url: `${BASE_URL}/ar${page}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: page === '' ? 'daily' : 'weekly',
      priority: page === '' ? 1.0 : 0.7,
      alternates: {
        languages: {
          ar: `${BASE_URL}/ar${page}`,
          en: `${BASE_URL}/en${page}`,
        },
      },
    });
    entries.push({
      url: `${BASE_URL}/en${page}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: page === '' ? 'daily' : 'weekly',
      priority: page === '' ? 1.0 : 0.7,
      alternates: {
        languages: {
          ar: `${BASE_URL}/ar${page}`,
          en: `${BASE_URL}/en${page}`,
        },
      },
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
        const arSlug = p.slug_ar || p.slug_en || p.id;
        const enSlug = p.slug_en || p.slug_ar || p.id;
        const alternates = {
          languages: {
            ar: `${BASE_URL}/ar/projects/${arSlug}`,
            en: `${BASE_URL}/en/projects/${enSlug}`,
          },
        };
        entries.push({
          url: `${BASE_URL}/ar/projects/${arSlug}`,
          lastModified: new Date(p.updated_at),
          changeFrequency: 'weekly',
          priority: 0.8,
          alternates,
        });
        entries.push({
          url: `${BASE_URL}/en/projects/${enSlug}`,
          lastModified: new Date(p.updated_at),
          changeFrequency: 'weekly',
          priority: 0.8,
          alternates,
        });
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
        const arSlug = p.slug_ar || p.slug_en || p.id;
        const enSlug = p.slug_en || p.slug_ar || p.id;
        const alternates = {
          languages: {
            ar: `${BASE_URL}/ar/products/${arSlug}`,
            en: `${BASE_URL}/en/products/${enSlug}`,
          },
        };
        entries.push({
          url: `${BASE_URL}/ar/products/${arSlug}`,
          lastModified: new Date(p.updated_at),
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates,
        });
        entries.push({
          url: `${BASE_URL}/en/products/${enSlug}`,
          lastModified: new Date(p.updated_at),
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates,
        });
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
        const arSlug = r.slug_ar || r.slug_en || r.id;
        const enSlug = r.slug_en || r.slug_ar || r.id;
        const alternates = {
          languages: {
            ar: `${BASE_URL}/ar/rfqs/${arSlug}`,
            en: `${BASE_URL}/en/rfqs/${enSlug}`,
          },
        };
        entries.push({
          url: `${BASE_URL}/ar/rfqs/${arSlug}`,
          lastModified: new Date(r.updated_at),
          changeFrequency: 'weekly',
          priority: 0.6,
          alternates,
        });
        entries.push({
          url: `${BASE_URL}/en/rfqs/${enSlug}`,
          lastModified: new Date(r.updated_at),
          changeFrequency: 'weekly',
          priority: 0.6,
          alternates,
        });
      }
    }
  } catch {
    // If DB is unavailable, return static pages only
  }

  return entries;
}
