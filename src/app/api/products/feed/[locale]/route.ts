// =============================================================================
// Muhandes HUB — Google Merchant Center Product Feed (locale-aware)
// /api/products/feed/en  →  English feed, slug_en, /en/products/...
// /api/products/feed/ar  →  Arabic feed,   slug_ar, /ar/products/...
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://muhandeshub.com').trim();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd();
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;

  if (locale !== 'ar' && locale !== 'en') {
    return new NextResponse('Not found', { status: 404 });
  }

  const isAr = locale === 'ar';

  try {
    const supabase = await createClient();

    const { data: products } = await db(supabase)
      .from('products')
      .select(`
        id, name_ar, name_en, description_ar, description_en,
        pricing_model, price, in_stock, slug_ar, slug_en,
        category_id, supplier_id, updated_at
      `)
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(5000);

    if (!products || products.length === 0) {
      return new NextResponse(buildEmptyFeed(locale), {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      });
    }

    // Batch fetch suppliers
    const supplierIds = [...new Set(products.map((p: { supplier_id: string }) => p.supplier_id))];
    const { data: suppliers } = await db(supabase)
      .from('profiles')
      .select('id, company_name_ar, company_name_en, full_name')
      .in('id', supplierIds);

    const supplierMap = new Map<string, { company_name_ar: string; company_name_en: string; full_name: string }>();
    for (const s of suppliers ?? []) supplierMap.set(s.id, s);

    // Batch fetch categories
    const categoryIds = [...new Set(products.map((p: { category_id: string | null }) => p.category_id).filter(Boolean))];
    const categoryMap = new Map<string, { name_ar: string; name_en: string }>();
    if (categoryIds.length > 0) {
      const { data: categories } = await db(supabase)
        .from('categories')
        .select('id, name_ar, name_en')
        .in('id', categoryIds);
      for (const c of categories ?? []) categoryMap.set(c.id, c);
    }

    // Fetch primary images
    const productIds = products.map((p: { id: string }) => p.id);
    const { data: allImages } = await db(supabase)
      .from('product_images')
      .select('product_id, image_url, is_primary, display_order')
      .in('product_id', productIds)
      .order('display_order', { ascending: true });

    const imageMap = new Map<string, string>();
    if (allImages) {
      const grouped = new Map<string, Array<{ image_url: string; is_primary: boolean; display_order: number }>>();
      for (const img of allImages) {
        if (!grouped.has(img.product_id)) grouped.set(img.product_id, []);
        grouped.get(img.product_id)!.push(img);
      }
      for (const [pid, imgs] of grouped) {
        const primary = imgs.find((i) => i.is_primary) ?? imgs[0];
        if (primary) imageMap.set(pid, primary.image_url);
      }
    }

    // Fetch variants
    const variantProductIds = products
      .filter((p: { pricing_model: string }) => p.pricing_model === 'variant')
      .map((p: { id: string }) => p.id);

    const variantMap = new Map<string, Array<{ id: string; name_en: string; name_ar: string; sku: string | null; price: number }>>();
    if (variantProductIds.length > 0) {
      const { data: allVariants } = await db(supabase)
        .from('product_variants')
        .select('id, product_id, name_ar, name_en, sku, price, sort_order')
        .in('product_id', variantProductIds)
        .order('sort_order', { ascending: true });

      for (const v of allVariants ?? []) {
        if (!variantMap.has(v.product_id)) variantMap.set(v.product_id, []);
        variantMap.get(v.product_id)!.push(v);
      }
    }

    const items: string[] = [];

    for (const product of products) {
      // Locale-specific slug — required for this feed; skip if absent
      const productSlug: string = isAr ? product.slug_ar : product.slug_en;
      const imageUrl = imageMap.get(product.id);
      if (!productSlug) continue;

      const productLink = `${BASE_URL}/${locale}/products/${encodeURIComponent(productSlug)}`;
      const availability = product.in_stock ? 'in_stock' : 'out_of_stock';

      const supplier = supplierMap.get(product.supplier_id);
      const brand = isAr
        ? (supplier?.company_name_ar || supplier?.company_name_en || supplier?.full_name || 'Muhandes HUB')
        : (supplier?.company_name_en || supplier?.company_name_ar || supplier?.full_name || 'Muhandes HUB');

      const category = product.category_id ? categoryMap.get(product.category_id) : null;
      const categoryName = isAr
        ? (category?.name_ar || category?.name_en)
        : (category?.name_en || category?.name_ar);

      const title = isAr
        ? (product.name_ar || product.name_en)
        : (product.name_en || product.name_ar);
      const description = isAr
        ? (product.description_ar || product.description_en)
        : (product.description_en || product.description_ar);

      if (product.pricing_model === 'variant') {
        const variants = variantMap.get(product.id) ?? [];
        for (const v of variants) {
          const variantName = isAr ? (v.name_ar || v.name_en) : (v.name_en || v.name_ar);
          const variantTitle = variantName ? `${title} - ${variantName}` : title;
          items.push(buildItem({
            id: v.id,
            itemGroupId: product.id,
            title: variantTitle,
            description,
            link: productLink,
            imageUrl,
            price: v.price,
            availability,
            brand,
            condition: 'new',
            categoryName,
            sku: v.sku,
          }));
        }
        if (variants.length === 0) {
          items.push(buildItem({
            id: product.id,
            title,
            description,
            link: productLink,
            imageUrl,
            price: product.price,
            availability,
            brand,
            condition: 'new',
            categoryName,
          }));
        }
      } else {
        items.push(buildItem({
          id: product.id,
          title,
          description,
          link: productLink,
          imageUrl,
          price: product.price,
          availability,
          brand,
          condition: 'new',
          categoryName,
        }));
      }
    }

    return new NextResponse(buildFeed(items, locale), {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch {
    return new NextResponse(buildEmptyFeed(locale), {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
}

// ---------------------------------------------------------------------------
// XML builders
// ---------------------------------------------------------------------------

interface ItemProps {
  id: string;
  itemGroupId?: string;
  title: string;
  description: string;
  link: string;
  imageUrl?: string;
  price: number | null;
  availability: string;
  brand: string;
  condition: string;
  categoryName?: string;
  sku?: string | null;
}

function buildItem(props: ItemProps): string {
  const lines: string[] = ['    <item>'];
  lines.push(`      <g:id>${escapeXml(props.id)}</g:id>`);
  if (props.itemGroupId) {
    lines.push(`      <g:item_group_id>${escapeXml(props.itemGroupId)}</g:item_group_id>`);
  }
  lines.push(`      <title>${escapeXml(truncateText(props.title || '', 150))}</title>`);
  lines.push(`      <description>${escapeXml(truncateText(props.description || '', 5000))}</description>`);
  lines.push(`      <link>${escapeXml(props.link)}</link>`);
  if (props.imageUrl) {
    lines.push(`      <g:image_link>${escapeXml(props.imageUrl)}</g:image_link>`);
  }
  if (props.price != null && props.price > 0) {
    lines.push(`      <g:price>${props.price.toFixed(2)} SAR</g:price>`);
  }
  lines.push(`      <g:availability>${props.availability}</g:availability>`);
  lines.push(`      <g:condition>${props.condition}</g:condition>`);
  lines.push(`      <g:brand>${escapeXml(props.brand)}</g:brand>`);
  lines.push(`      <g:identifier_exists>false</g:identifier_exists>`);
  if (props.categoryName) {
    lines.push(`      <g:product_type>${escapeXml(props.categoryName)}</g:product_type>`);
  }
  if (props.sku) {
    lines.push(`      <g:mpn>${escapeXml(props.sku)}</g:mpn>`);
  }
  lines.push('    </item>');
  return lines.join('\n');
}

function buildFeed(items: string[], locale: string): string {
  const isAr = locale === 'ar';
  const title = isAr
    ? 'Muhandes HUB — منتجات البناء والتشييد'
    : 'Muhandes HUB — Construction Products Feed';
  const description = isAr
    ? 'مواد البناء والإنشاء من موردين سعوديين معتمدين'
    : 'Construction materials and supplies from verified Saudi suppliers';
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${BASE_URL}/${locale}</link>
    <description>${escapeXml(description)}</description>
${items.join('\n')}
  </channel>
</rss>`;
}

function buildEmptyFeed(locale: string): string {
  return buildFeed([], locale);
}
