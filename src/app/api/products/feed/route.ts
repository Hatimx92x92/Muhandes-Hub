// =============================================================================
// Muhandes HUB — Google Merchant Center Product Feed (RSS 2.0 + g: namespace)
// =============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://muhandeshub.com';

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

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all published products with supplier info
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
      return new NextResponse(buildEmptyFeed(), {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      });
    }

    // Collect unique supplier IDs and category IDs
    const supplierIds = [...new Set(products.map((p: { supplier_id: string }) => p.supplier_id))];
    const categoryIds = [...new Set(products.map((p: { category_id: string | null }) => p.category_id).filter(Boolean))];

    // Batch fetch suppliers
    const { data: suppliers } = await db(supabase)
      .from('profiles')
      .select('id, company_name_ar, company_name_en, full_name')
      .in('id', supplierIds);

    const supplierMap = new Map<string, { company_name_ar: string; company_name_en: string; full_name: string }>();
    for (const s of suppliers ?? []) {
      supplierMap.set(s.id, s);
    }

    // Batch fetch categories
    const categoryMap = new Map<string, { name_ar: string; name_en: string }>();
    if (categoryIds.length > 0) {
      const { data: categories } = await db(supabase)
        .from('categories')
        .select('id, name_ar, name_en')
        .in('id', categoryIds);
      for (const c of categories ?? []) {
        categoryMap.set(c.id, c);
      }
    }

    // Fetch primary images for all products in one query
    const productIds = products.map((p: { id: string }) => p.id);
    const { data: allImages } = await db(supabase)
      .from('product_images')
      .select('product_id, image_url, is_primary, display_order')
      .in('product_id', productIds)
      .order('display_order', { ascending: true });

    const imageMap = new Map<string, string>();
    if (allImages) {
      // Group by product_id, prefer is_primary, fallback to first
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

    // Fetch variants for variant-priced products
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

    // Build XML items
    const items: string[] = [];

    for (const product of products) {
      const supplier = supplierMap.get(product.supplier_id);
      const brand = supplier?.company_name_en || supplier?.company_name_ar || supplier?.full_name || 'Muhandes HUB';
      const category = product.category_id ? categoryMap.get(product.category_id) : null;
      const imageUrl = imageMap.get(product.id);
      const productSlug = product.slug_en || product.slug_ar || product.id;
      const productLink = `${BASE_URL}/en/products/${productSlug}`;
      const availability = product.in_stock ? 'in_stock' : 'out_of_stock';

      // Use English fields as primary (Google standard), fallback to Arabic
      const title = product.name_en || product.name_ar;
      const description = product.description_en || product.description_ar;

      if (product.pricing_model === 'variant') {
        // Emit separate items per variant with item_group_id
        const variants = variantMap.get(product.id) ?? [];
        for (const v of variants) {
          const variantTitle = v.name_en || v.name_ar
            ? `${title} - ${v.name_en || v.name_ar}`
            : title;
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
            categoryName: category?.name_en || category?.name_ar,
            sku: v.sku,
          }));
        }
        // Also emit parent if no variants found
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
            categoryName: category?.name_en || category?.name_ar,
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
          categoryName: category?.name_en || category?.name_ar,
        }));
      }
    }

    const xml = buildFeed(items);

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch {
    return new NextResponse(buildEmptyFeed(), {
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
  lines.push(`      <title>${escapeXml(truncateText(props.title, 150))}</title>`);
  lines.push(`      <description>${escapeXml(truncateText(props.description, 5000))}</description>`);
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

function buildFeed(items: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Muhandes HUB — Product Feed</title>
    <link>${BASE_URL}</link>
    <description>Construction materials and supplies from verified Saudi suppliers</description>
${items.join('\n')}
  </channel>
</rss>`;
}

function buildEmptyFeed(): string {
  return buildFeed([]);
}
