// =============================================================================
// Muqawil HUB — Product Server Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { ProductSchema, UpdateProductSchema } from '@/schemas/product';
import type { ActionResult } from '@/types';
import { TIER_LIMITS } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: Awaited<ReturnType<typeof createClient>>): any {
  return supabase;
}

function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? 'form');
    fieldErrors[key] = fieldErrors[key] ?? [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

// ---------------------------------------------------------------------------
// CREATE PRODUCT
// ---------------------------------------------------------------------------
export async function createProduct(
  _prevState: ActionResult<{ id: string; status: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string; status: string }>> {
  const t = await getTranslations('actions.products');

  // 1. Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: t('mustLogin') };
  }

  // 2. Role check — supplier only
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role, subscription_tier')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'supplier') {
    return { data: null, error: t('suppliersOnly') };
  }

  // 3. Tier limit check
  const tier = profile.subscription_tier || 'starter';
  const limits = TIER_LIMITS[tier];
  if (limits) {
    const { count } = await db(supabase)
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('supplier_id', user.id);

    if (count != null && count >= limits.productPosts) {
      return { data: null, error: t('productLimitReached', { limit: limits.productPosts }) };
    }
  }

  // 4. Parse variants from FormData
  const variantsJson = formData.get('variants');
  let variants: unknown[] | undefined;
  if (variantsJson && typeof variantsJson === 'string' && variantsJson.length > 0) {
    try {
      variants = JSON.parse(variantsJson);
    } catch {
      return { data: null, error: t('invalidVariants') };
    }
  }

  // 5. Validate
  const raw = {
    name_ar: formData.get('name_ar'),
    name_en: formData.get('name_en'),
    description_ar: formData.get('description_ar'),
    description_en: formData.get('description_en'),
    category_id: formData.get('category_id') || undefined,
    pricing_model: formData.get('pricing_model') || 'fixed',
    price: formData.get('price') || undefined,
    in_stock: formData.get('in_stock') !== 'false',
    stock_quantity: formData.get('stock_quantity') || undefined,
    min_order_qty: formData.get('min_order_qty') || 1,
    lead_time_days: formData.get('lead_time_days') || undefined,
    variants,
  };

  const parsed = ProductSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  // 6. Insert product
  const { data: product, error: insertErr } = await db(supabase)
    .from('products')
    .insert({
      supplier_id: user.id,
      name_ar: parsed.data.name_ar,
      name_en: parsed.data.name_en,
      description_ar: parsed.data.description_ar,
      description_en: parsed.data.description_en,
      category_id: parsed.data.category_id || null,
      pricing_model: parsed.data.pricing_model,
      price: parsed.data.pricing_model === 'fixed' ? parsed.data.price : null,
      in_stock: parsed.data.in_stock,
      stock_quantity: parsed.data.stock_quantity ?? null,
      status: 'draft',
    })
    .select('id, status')
    .single();

  if (insertErr || !product) {
    return { data: null, error: t('createError') };
  }

  // 7. Insert variants (if variant-based)
  if (parsed.data.pricing_model === 'variant' && parsed.data.variants?.length) {
    const variantRows = parsed.data.variants.map((v, i) => ({
      product_id: product.id,
      name_ar: v.name_ar,
      name_en: v.name_en,
      sku: v.sku || null,
      price: v.price,
      stock_quantity: v.stock_quantity ?? null,
      sort_order: v.sort_order ?? i,
    }));

    await db(supabase).from('product_variants').insert(variantRows);
  }

  // 8. Revalidate
  revalidatePath('/dashboard/products');

  return { data: { id: product.id, status: product.status }, error: null };
}

// ---------------------------------------------------------------------------
// UPDATE PRODUCT (draft/rejected only)
// ---------------------------------------------------------------------------
export async function updateProduct(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.products');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: t('mustLogin') };
  }

  const variantsJson = formData.get('variants');
  let variants: unknown[] | undefined;
  if (variantsJson && typeof variantsJson === 'string' && variantsJson.length > 0) {
    try {
      variants = JSON.parse(variantsJson);
    } catch {
      return { data: null, error: t('invalidVariants') };
    }
  }

  const raw = {
    product_id: formData.get('product_id'),
    name_ar: formData.get('name_ar'),
    name_en: formData.get('name_en'),
    description_ar: formData.get('description_ar'),
    description_en: formData.get('description_en'),
    category_id: formData.get('category_id') || undefined,
    pricing_model: formData.get('pricing_model') || 'fixed',
    price: formData.get('price') || undefined,
    in_stock: formData.get('in_stock') !== 'false',
    stock_quantity: formData.get('stock_quantity') || undefined,
    min_order_qty: formData.get('min_order_qty') || 1,
    lead_time_days: formData.get('lead_time_days') || undefined,
    variants,
  };

  const parsed = UpdateProductSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  // Ownership + status check
  const { data: existing } = await db(supabase)
    .from('products')
    .select('supplier_id, status')
    .eq('id', parsed.data.product_id)
    .single();

  if (!existing) {
    return { data: null, error: t('productNotFound') };
  }
  if (existing.supplier_id !== user.id) {
    return { data: null, error: t('noPermissionEdit') };
  }
  if (!['draft', 'rejected'].includes(existing.status)) {
    return { data: null, error: t('cannotEditStatus') };
  }

  // Update product
  const { error: updateErr } = await db(supabase)
    .from('products')
    .update({
      name_ar: parsed.data.name_ar,
      name_en: parsed.data.name_en,
      description_ar: parsed.data.description_ar,
      description_en: parsed.data.description_en,
      category_id: parsed.data.category_id || null,
      pricing_model: parsed.data.pricing_model,
      price: parsed.data.pricing_model === 'fixed' ? parsed.data.price : null,
      in_stock: parsed.data.in_stock,
      stock_quantity: parsed.data.stock_quantity ?? null,
      status: 'draft',
    })
    .eq('id', parsed.data.product_id);

  if (updateErr) {
    return { data: null, error: t('updateError') };
  }

  // Replace variants
  if (parsed.data.pricing_model === 'variant') {
    await db(supabase)
      .from('product_variants')
      .delete()
      .eq('product_id', parsed.data.product_id);

    if (parsed.data.variants?.length) {
      const variantRows = parsed.data.variants.map((v, i) => ({
        product_id: parsed.data.product_id,
        name_ar: v.name_ar,
        name_en: v.name_en,
        sku: v.sku || null,
        price: v.price,
        stock_quantity: v.stock_quantity ?? null,
        sort_order: v.sort_order ?? i,
      }));

      await db(supabase).from('product_variants').insert(variantRows);
    }
  }

  revalidatePath('/dashboard/products');
  revalidatePath(`/dashboard/products/${parsed.data.product_id}`);

  return { data: { id: parsed.data.product_id }, error: null };
}

// ---------------------------------------------------------------------------
// SUBMIT FOR APPROVAL
// ---------------------------------------------------------------------------
export async function submitProductForApproval(
  productId: string,
): Promise<ActionResult<{ status: string }>> {
  const t = await getTranslations('actions.products');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: t('mustLogin') };
  }

  const { data: product } = await db(supabase)
    .from('products')
    .select('supplier_id, status')
    .eq('id', productId)
    .single();

  if (!product) {
    return { data: null, error: t('productNotFound') };
  }
  if (product.supplier_id !== user.id) {
    return { data: null, error: t('noPermission') };
  }
  if (!['draft', 'rejected'].includes(product.status)) {
    return { data: null, error: t('cannotSubmitStatus') };
  }

  const { error: updateErr } = await db(supabase)
    .from('products')
    .update({ status: 'pending' })
    .eq('id', productId);

  if (updateErr) {
    return { data: null, error: t('submitError') };
  }

  revalidatePath('/dashboard/products');
  return { data: { status: 'pending' }, error: null };
}

// ---------------------------------------------------------------------------
// DELETE PRODUCT (draft only, no active deals)
// ---------------------------------------------------------------------------
export async function deleteProduct(
  productId: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  const t = await getTranslations('actions.products');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: t('mustLogin') };
  }

  const { data: product } = await db(supabase)
    .from('products')
    .select('supplier_id, status')
    .eq('id', productId)
    .single();

  if (!product) {
    return { data: null, error: t('productNotFound') };
  }
  if (product.supplier_id !== user.id) {
    return { data: null, error: t('noPermission') };
  }
  if (product.status !== 'draft') {
    return { data: null, error: t('cannotDeleteNonDraft') };
  }

  // TODO: Delete images and spec sheets from storage when Supabase Storage is configured

  const { error: deleteErr } = await db(supabase)
    .from('products')
    .delete()
    .eq('id', productId);

  if (deleteErr) {
    return { data: null, error: t('deleteError') };
  }

  revalidatePath('/dashboard/products');
  return { data: { deleted: true }, error: null };
}

// ---------------------------------------------------------------------------
// BULK CSV IMPORT — Business+ tier only
// Expected CSV columns: title_ar, title_en, description_ar, description_en,
//   category_id, price, unit, moq, sku
// ---------------------------------------------------------------------------
interface BulkImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export async function bulkImportProducts(
  formData: FormData,
): Promise<ActionResult<BulkImportResult>> {
  const t = await getTranslations('actions.products');

  // 1. Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // 2. Role + tier check
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role, subscription_tier')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'supplier') {
    return { data: null, error: t('suppliersOnlyImport') };
  }

  const tier = (profile.subscription_tier || 'starter') as string;
  if (!['business', 'enterprise'].includes(tier)) {
    return { data: null, error: t('bulkImportTierRequired') };
  }

  // 3. Read & parse CSV
  const file = formData.get('csv_file');
  if (!file || !(file instanceof File)) {
    return { data: null, error: t('pleaseUploadCSV') };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { data: null, error: t('fileTooLarge5MB') };
  }

  const text = await file.text();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  if (lines.length < 2) {
    return { data: null, error: t('emptyFile') };
  }

  // Parse header
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
  const requiredCols = ['title_ar', 'price'];
  for (const col of requiredCols) {
    if (!headers.includes(col)) {
      return { data: null, error: t('missingColumn', { col }) };
    }
  }

  // 4. Check remaining product limit
  const tierLimits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];
  const maxProducts = tierLimits?.productPosts ?? 50;

  const { count: existingCount } = await db(supabase)
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('supplier_id', user.id);

  const remaining = maxProducts === Infinity ? Infinity : maxProducts - (existingCount ?? 0);
  const dataLines = lines.slice(1);

  if (remaining !== Infinity && dataLines.length > remaining) {
    return { data: null, error: t('maxImportLimit', { remaining }) };
  }

  // 5. Parse rows and bulk insert
  const errors: string[] = [];
  const products: Record<string, unknown>[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const row = parseCSVRow(dataLines[i]);
    if (row.length !== headers.length) {
      errors.push(t('rowColumnMismatch', { line: i + 2 }));
      continue;
    }

    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = row[idx]; });

    const titleAr = obj.title_ar?.trim();
    const price = Number(obj.price);

    if (!titleAr) {
      errors.push(t('rowTitleRequired', { line: i + 2 }));
      continue;
    }
    if (isNaN(price) || price < 0) {
      errors.push(t('rowInvalidPrice', { line: i + 2 }));
      continue;
    }

    products.push({
      supplier_id: user.id,
      title_ar: titleAr,
      title_en: obj.title_en?.trim() || '',
      description_ar: obj.description_ar?.trim() || '',
      description_en: obj.description_en?.trim() || '',
      category_id: obj.category_id?.trim() || null,
      price,
      unit: obj.unit?.trim() || 'piece',
      moq: obj.moq ? parseInt(obj.moq, 10) || 1 : 1,
      sku: obj.sku?.trim() || null,
      status: 'draft',
    });
  }

  if (products.length === 0) {
    return { data: null, error: t('noValidProducts') };
  }

  // Batch insert (max 100 at a time)
  let imported = 0;
  for (let i = 0; i < products.length; i += 100) {
    const batch = products.slice(i, i + 100);
    const { error: insertErr } = await db(supabase)
      .from('products')
      .insert(batch);

    if (insertErr) {
      errors.push(`خطأ في الإدراج: ${insertErr.message}`);
    } else {
      imported += batch.length;
    }
  }

  revalidatePath('/dashboard/products');
  return {
    data: {
      imported,
      skipped: dataLines.length - imported,
      errors,
    },
    error: null,
  };
}

/** Simple CSV row parser that handles quoted fields */
function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}
