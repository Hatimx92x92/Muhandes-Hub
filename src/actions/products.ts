// =============================================================================
// Muhandes HUB â€” Product Server Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';
import { localizeFieldErrors } from '@/lib/zod-i18n';
import { ProductSchema, UpdateProductSchema } from '@/schemas/product';
import { apiLimiter, checkRateLimit } from '@/lib/rate-limit';
import type { ActionResult } from '@/types';
import { TIER_LIMITS } from '@/types';
import { generateUniqueSlug } from '@/lib/utils';
import { autoTranslateBilingualFields } from '@/lib/translate';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: Awaited<ReturnType<typeof createClient>>): any {
  return supabase;
}

async function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Promise<Record<string, string[]>> {
  const locale = await getLocale();
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? 'form');
    fieldErrors[key] = fieldErrors[key] ?? [];
    fieldErrors[key].push(issue.message);
  }
  return localizeFieldErrors(fieldErrors, locale);
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

  // 1b. Rate limit
  const rl = apiLimiter();
  const { success: rlOk } = await checkRateLimit(rl, user.id);
  if (!rlOk) return { data: null, error: t('tooManyRequests') };

  // 2. Role check â€” supplier only
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'supplier') {
    return { data: null, error: t('suppliersOnly') };
  }

  // 3. Tier limit check
  const { data: subscription } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const tier = (subscription?.tier || 'starter') as keyof typeof TIER_LIMITS;
  const limits = TIER_LIMITS[tier];
  if (limits) {
    const { count } = await db(supabase)
      .from('products')
      .select('id', { count: 'exact' })
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
    return { data: null, error: t('invalidData'), fieldErrors: await toFieldErrors(parsed.error.issues) };
  }

  // 5b. Auto-translate missing bilingual fields
  const translated = await autoTranslateBilingualFields(parsed.data as Record<string, unknown>, ['name', 'description']);

  // 6. Generate slugs
  const [slug_ar, slug_en] = await Promise.all([
    generateUniqueSlug(translated.name_ar as string || parsed.data.name_ar || '', 'products', 'slug_ar', db(supabase)),
    generateUniqueSlug(translated.name_en as string || parsed.data.name_en || '', 'products', 'slug_en', db(supabase)),
  ]);

  // 7. Insert product
  const { data: product, error: insertErr } = await db(supabase)
    .from('products')
    .insert({
      supplier_id: user.id,
        name_ar: (translated.name_ar as string) || parsed.data.name_ar || '',
        name_en: (translated.name_en as string) || parsed.data.name_en || '',
        description_ar: (translated.description_ar as string) || parsed.data.description_ar || '',
        description_en: (translated.description_en as string) || parsed.data.description_en || '',
      category_id: parsed.data.category_id || null,
      pricing_model: parsed.data.pricing_model,
      price: parsed.data.pricing_model === 'fixed' ? parsed.data.price : null,
      in_stock: parsed.data.in_stock,
      stock_quantity: parsed.data.stock_quantity ?? null,
      slug_ar,
      slug_en,
      status: 'published',
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

  // 8. Upload images from FormData — at least one required
  const imageFiles = formData.getAll('image_files') as File[];
  const validImageFiles = imageFiles.filter((f) => f && f.size > 0);
  if (validImageFiles.length === 0) {
    await db(supabase).from('products').delete().eq('id', product.id);
    return { data: null, error: t('imageRequired') };
  }
  if (validImageFiles.length > 0) {
    const { uploadFile: doUpload } = await import('@/actions/uploads');
    for (let i = 0; i < validImageFiles.length; i++) {
      const file = validImageFiles[i];
      const uploadResult = await doUpload('product-images', file, `${product.id}/${Date.now()}-${i}`);
      if (uploadResult.data) {
        await db(supabase).from('product_images').insert({
          product_id: product.id,
          image_url: uploadResult.data.url,
          display_order: i,
          is_primary: i === 0,
        });
      }
    }
  }

  // 9. Upload spec sheets from FormData
  const specFiles = formData.getAll('spec_files') as File[];
  if (specFiles.length > 0) {
    const { uploadFile: doUpload } = await import('@/actions/uploads');
    for (const file of specFiles) {
      if (!file || file.size === 0) continue;
      const uploadResult = await doUpload('product-specs', file, `${product.id}/spec-${Date.now()}`);
      if (uploadResult.data) {
        await db(supabase).from('product_spec_sheets').insert({
          product_id: product.id,
          file_url: uploadResult.data.url,
          file_name: file.name,
          file_size: file.size,
        });
      }
    }
  }

  // 10. Revalidate
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
    return { data: null, error: t('invalidData'), fieldErrors: await toFieldErrors(parsed.error.issues) };
  }

  // Auto-translate missing bilingual fields
  const translated = await autoTranslateBilingualFields(parsed.data as Record<string, unknown>, ['name', 'description']);

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
  if (!['draft', 'rejected', 'published'].includes(existing.status)) {
    return { data: null, error: t('cannotEditStatus') };
  }

  // Regenerate slugs
  const [slug_ar, slug_en] = await Promise.all([
      generateUniqueSlug((translated.name_ar as string) || parsed.data.name_ar || '', 'products', 'slug_ar', db(supabase), parsed.data.product_id),
      generateUniqueSlug((translated.name_en as string) || parsed.data.name_en || '', 'products', 'slug_en', db(supabase), parsed.data.product_id),
  ]);

  // Update product
  const { error: updateErr } = await db(supabase)
    .from('products')
    .update({
      name_ar: (translated.name_ar as string) || parsed.data.name_ar || '',
      name_en: (translated.name_en as string) || parsed.data.name_en || '',
      description_ar: (translated.description_ar as string) || parsed.data.description_ar || '',
      description_en: (translated.description_en as string) || parsed.data.description_en || '',
      category_id: parsed.data.category_id || null,
      pricing_model: parsed.data.pricing_model,
      price: parsed.data.pricing_model === 'fixed' ? parsed.data.price : null,
      in_stock: parsed.data.in_stock,
      stock_quantity: parsed.data.stock_quantity ?? null,
      slug_ar,
      slug_en,
      status: 'published',
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

  // Upload new images from FormData
  const imageFiles = formData.getAll('image_files') as File[];
  if (imageFiles.length > 0) {
    const { uploadFile: doUpload } = await import('@/actions/uploads');
    const { count: existingCount } = await db(supabase)
      .from('product_images')
      .select('id', { count: 'exact' })
      .eq('product_id', parsed.data.product_id);
    const startOrder = existingCount ?? 0;
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      if (!file || file.size === 0) continue;
      const uploadResult = await doUpload('product-images', file, `${parsed.data.product_id}/${Date.now()}-${i}`);
      if (uploadResult.data) {
        await db(supabase).from('product_images').insert({
          product_id: parsed.data.product_id,
          image_url: uploadResult.data.url,
          display_order: startOrder + i,
          is_primary: startOrder === 0 && i === 0,
        });
      }
    }
  }

  // Upload new spec sheets from FormData
  const specFiles = formData.getAll('spec_files') as File[];
  if (specFiles.length > 0) {
    const { uploadFile: doUpload } = await import('@/actions/uploads');
    for (const file of specFiles) {
      if (!file || file.size === 0) continue;
      const uploadResult = await doUpload('product-specs', file, `${parsed.data.product_id}/spec-${Date.now()}`);
      if (uploadResult.data) {
        await db(supabase).from('product_spec_sheets').insert({
          product_id: parsed.data.product_id,
          file_url: uploadResult.data.url,
          file_name: file.name,
          file_size: file.size,
        });
      }
    }
  }

  revalidatePath('/dashboard/products');
  revalidatePath(`/dashboard/products/${parsed.data.product_id}`);

  return { data: { id: parsed.data.product_id }, error: null };
}

// ---------------------------------------------------------------------------
// SUBMIT FOR APPROVAL — DEPRECATED (products auto-publish now)
// Kept for backward compatibility; now publishes directly.
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

  const { error: updateErr } = await db(supabase)
    .from('products')
    .update({ status: 'published' })
    .eq('id', productId);

  if (updateErr) {
    return { data: null, error: t('submitError') };
  }

  revalidatePath('/dashboard/products');
  return { data: { status: 'published' }, error: null };
}

// ---------------------------------------------------------------------------
// DELETE PRODUCT (any status, no active deals)
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

  // Check for active deals linked to this product
  const { count: activeDealCount } = await db(supabase)
    .from('deals')
    .select('id', { count: 'exact' })
    .eq('product_id', productId)
    .not('status', 'in', '(completed,cancelled)');
  if (activeDealCount && activeDealCount > 0) {
    return { data: null, error: t('cannotDeleteActiveDeals') };
  }

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
// ADD PRODUCT IMAGE
// ---------------------------------------------------------------------------
export async function addProductImage(
  productId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string; image_url: string; display_order: number; is_primary: boolean }>> {
  const t = await getTranslations('actions.products');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const rl = apiLimiter();
  const { success: rlOk } = await checkRateLimit(rl, user.id);
  if (!rlOk) return { data: null, error: t('tooManyRequests') };

  // Ownership check
  const { data: product } = await db(supabase)
    .from('products')
    .select('supplier_id')
    .eq('id', productId)
    .single();
  if (!product) return { data: null, error: t('productNotFound') };
  if (product.supplier_id !== user.id) return { data: null, error: t('noPermission') };

  // Check image count limit (max 10)
  const { count } = await db(supabase)
    .from('product_images')
    .select('id', { count: 'exact' })
    .eq('product_id', productId);
  if (count != null && count >= 10) return { data: null, error: t('imageLimitReached') };

  // Upload file
  const file = formData.get('image') as File | null;
  if (!file || file.size === 0) return { data: null, error: t('noImageSelected') };

  const { uploadFile } = await import('@/actions/uploads');
  const uploadResult = await uploadFile('product-images', file, `${productId}/${Date.now()}`);
  if (uploadResult.error) return { data: null, error: uploadResult.error };

  // Determine display order and if this is the first image (make it primary)
  const isPrimary = count === 0 || count == null;
  const displayOrder = count ?? 0;

  const { data: image, error: insertErr } = await db(supabase)
    .from('product_images')
    .insert({
      product_id: productId,
      image_url: uploadResult.data!.url,
      display_order: displayOrder,
      is_primary: isPrimary,
    })
    .select('id, image_url, display_order, is_primary')
    .single();

  if (insertErr || !image) return { data: null, error: t('imageUploadError') };

  revalidatePath(`/dashboard/products/${productId}`);
  revalidatePath(`/products`);
  return { data: image, error: null };
}

// ---------------------------------------------------------------------------
// REMOVE PRODUCT IMAGE
// ---------------------------------------------------------------------------
export async function removeProductImage(
  productId: string,
  imageId: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  const t = await getTranslations('actions.products');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Ownership check
  const { data: product } = await db(supabase)
    .from('products')
    .select('supplier_id')
    .eq('id', productId)
    .single();
  if (!product) return { data: null, error: t('productNotFound') };
  if (product.supplier_id !== user.id) return { data: null, error: t('noPermission') };

  // Get image to check if it was primary
  const { data: image } = await db(supabase)
    .from('product_images')
    .select('id, is_primary')
    .eq('id', imageId)
    .eq('product_id', productId)
    .single();
  if (!image) return { data: null, error: t('imageNotFound') };

  // Delete the image
  const { error: deleteErr } = await db(supabase)
    .from('product_images')
    .delete()
    .eq('id', imageId);
  if (deleteErr) return { data: null, error: t('deleteError') };

  // If deleted image was primary, promote the next one
  if (image.is_primary) {
    const { data: nextImage } = await db(supabase)
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .order('display_order', { ascending: true })
      .limit(1)
      .single();
    if (nextImage) {
      await db(supabase)
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', nextImage.id);
    }
  }

  revalidatePath(`/dashboard/products/${productId}`);
  revalidatePath(`/products`);
  return { data: { deleted: true }, error: null };
}

// ---------------------------------------------------------------------------
// SET PRIMARY IMAGE
// ---------------------------------------------------------------------------
export async function setPrimaryImage(
  productId: string,
  imageId: string,
): Promise<ActionResult<{ updated: boolean }>> {
  const t = await getTranslations('actions.products');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Ownership check
  const { data: product } = await db(supabase)
    .from('products')
    .select('supplier_id')
    .eq('id', productId)
    .single();
  if (!product) return { data: null, error: t('productNotFound') };
  if (product.supplier_id !== user.id) return { data: null, error: t('noPermission') };

  // Unset all primary flags for this product
  await db(supabase)
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId);

  // Set the chosen image as primary
  const { error: updateErr } = await db(supabase)
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)
    .eq('product_id', productId);

  if (updateErr) return { data: null, error: t('updateError') };

  revalidatePath(`/dashboard/products/${productId}`);
  revalidatePath(`/products`);
  return { data: { updated: true }, error: null };
}

// ---------------------------------------------------------------------------
// ADD PRODUCT SPEC SHEET
// ---------------------------------------------------------------------------
export async function addProductSpecSheet(
  productId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string; file_url: string; file_name: string; file_size: number }>> {
  const t = await getTranslations('actions.products');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const rl = apiLimiter();
  const { success: rlOk } = await checkRateLimit(rl, user.id);
  if (!rlOk) return { data: null, error: t('tooManyRequests') };

  // Ownership check
  const { data: product } = await db(supabase)
    .from('products')
    .select('supplier_id')
    .eq('id', productId)
    .single();
  if (!product) return { data: null, error: t('productNotFound') };
  if (product.supplier_id !== user.id) return { data: null, error: t('noPermission') };

  // Check spec count limit (max 5)
  const { count } = await db(supabase)
    .from('product_spec_sheets')
    .select('id', { count: 'exact' })
    .eq('product_id', productId);
  if (count != null && count >= 5) return { data: null, error: t('specLimitReached') };

  const file = formData.get('spec') as File | null;
  if (!file || file.size === 0) return { data: null, error: t('noFileSelected') };

  const { uploadFile } = await import('@/actions/uploads');
  const uploadResult = await uploadFile('product-specs', file, `${productId}/spec-${Date.now()}`);
  if (uploadResult.error) return { data: null, error: uploadResult.error };

  const { data: spec, error: insertErr } = await db(supabase)
    .from('product_spec_sheets')
    .insert({
      product_id: productId,
      file_url: uploadResult.data!.url,
      file_name: file.name,
      file_size: file.size,
    })
    .select('id, file_url, file_name, file_size')
    .single();

  if (insertErr || !spec) return { data: null, error: t('specUploadError') };

  revalidatePath(`/dashboard/products/${productId}`);
  revalidatePath(`/products`);
  return { data: spec, error: null };
}

// ---------------------------------------------------------------------------
// REMOVE PRODUCT SPEC SHEET
// ---------------------------------------------------------------------------
export async function removeProductSpecSheet(
  productId: string,
  specId: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  const t = await getTranslations('actions.products');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Ownership check
  const { data: product } = await db(supabase)
    .from('products')
    .select('supplier_id')
    .eq('id', productId)
    .single();
  if (!product) return { data: null, error: t('productNotFound') };
  if (product.supplier_id !== user.id) return { data: null, error: t('noPermission') };

  const { error: deleteErr } = await db(supabase)
    .from('product_spec_sheets')
    .delete()
    .eq('id', specId)
    .eq('product_id', productId);

  if (deleteErr) return { data: null, error: t('deleteError') };

  revalidatePath(`/dashboard/products/${productId}`);
  revalidatePath(`/products`);
  return { data: { deleted: true }, error: null };
}

// ---------------------------------------------------------------------------
// BULK CSV IMPORT â€” Business+ tier only
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
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'supplier') {
    return { data: null, error: t('suppliersOnlyImport') };
  }

  const { data: sub } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const tier = (sub?.tier || 'starter') as string;
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
    .select('id', { count: 'exact' })
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
      status: 'published',
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
      errors.push(`Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø¥Ø¯Ø±Ø§Ø¬: ${insertErr.message}`);
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

// ---------------------------------------------------------------------------
// SEARCH PUBLISHED PRODUCTS (for RFQ product selector)
// ---------------------------------------------------------------------------
export interface SearchedProduct {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  price: number | null;
  min_order_qty: number | null;
  lead_time_days: number | null;
  in_stock: boolean;
  primary_image_url: string | null;
}

export async function searchPublishedProducts(
  search: string = '',
): Promise<ActionResult<SearchedProduct[]>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  let query = db(supabase)
    .from('products')
    .select('id, name_ar, name_en, description_ar, description_en, price, min_order_qty, lead_time_days, in_stock')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(20);

  if (search.trim()) {
    query = query.or(`name_ar.ilike.%${search}%,name_en.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  if (!data || data.length === 0) return { data: [], error: null };

  // Fetch primary images for returned products
  const products = data as { id: string; name_ar: string; name_en: string; description_ar: string | null; description_en: string | null; price: number | null; min_order_qty: number | null; lead_time_days: number | null; in_stock: boolean }[];
  const productIds = products.map((p) => p.id);
  const { data: images } = await db(supabase)
    .from('product_images')
    .select('product_id, image_url')
    .in('product_id', productIds)
    .eq('is_primary', true);

  const imageMap = new Map<string, string>();
  if (images) {
    for (const img of images) {
      imageMap.set(img.product_id, img.image_url);
    }
  }

  const merged: SearchedProduct[] = products.map((p) => ({
    id: p.id,
    name_ar: p.name_ar,
    name_en: p.name_en,
    description_ar: p.description_ar,
    description_en: p.description_en,
    price: p.price,
    min_order_qty: p.min_order_qty,
    lead_time_days: p.lead_time_days,
    in_stock: p.in_stock,
    primary_image_url: imageMap.get(p.id) ?? null,
  }));

  return { data: merged, error: null };
}

// ---------------------------------------------------------------------------
// BULK DELETE PRODUCTS
// ---------------------------------------------------------------------------
export async function bulkDeleteProducts(
  productIds: string[],
): Promise<ActionResult<{ deleted: string[]; failed: { id: string; reason: string }[] }>> {
  const t = await getTranslations('actions.products');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const rl = apiLimiter();
  const { success: rlOk } = await checkRateLimit(rl, user.id);
  if (!rlOk) return { data: null, error: t('tooManyRequests') };

  if (!productIds.length || productIds.length > 100) {
    return { data: null, error: t('invalidData') };
  }

  // Fetch all products to verify ownership
  const { data: products } = await db(supabase)
    .from('products')
    .select('id, supplier_id, status')
    .in('id', productIds);

  if (!products) return { data: null, error: t('deleteError') };

  const deleted: string[] = [];
  const failed: { id: string; reason: string }[] = [];

  // Check for active deals on all products at once
  const { data: activeDeals } = await db(supabase)
    .from('deals')
    .select('product_id')
    .in('product_id', productIds)
    .not('status', 'in', '(completed,cancelled)');
  const productsWithDeals = new Set((activeDeals ?? []).map((d: { product_id: string }) => d.product_id));

  const idsToDelete: string[] = [];
  for (const product of products) {
    if (product.supplier_id !== user.id) {
      failed.push({ id: product.id, reason: t('noPermission') });
    } else if (productsWithDeals.has(product.id)) {
      failed.push({ id: product.id, reason: t('cannotDeleteActiveDeals') });
    } else {
      idsToDelete.push(product.id);
    }
  }

  if (idsToDelete.length > 0) {
    const { error: deleteErr } = await db(supabase)
      .from('products')
      .delete()
      .in('id', idsToDelete);

    if (deleteErr) {
      return { data: null, error: t('deleteError') };
    }
    deleted.push(...idsToDelete);
  }

  revalidatePath('/dashboard/products');
  revalidatePath('/products');
  return { data: { deleted, failed }, error: null };
}

// ---------------------------------------------------------------------------
// BULK UPDATE PRODUCT STATUS (publish / unpublish)
// ---------------------------------------------------------------------------
export async function bulkUpdateProductStatus(
  productIds: string[],
  status: 'draft' | 'published',
): Promise<ActionResult<{ updated: number; failed: { id: string; reason: string }[] }>> {
  const t = await getTranslations('actions.products');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const rl = apiLimiter();
  const { success: rlOk } = await checkRateLimit(rl, user.id);
  if (!rlOk) return { data: null, error: t('tooManyRequests') };

  if (!productIds.length || productIds.length > 100) {
    return { data: null, error: t('invalidData') };
  }

  // Verify ownership
  const { data: products } = await db(supabase)
    .from('products')
    .select('id, supplier_id')
    .in('id', productIds);

  if (!products) return { data: null, error: t('updateError') };

  const failed: { id: string; reason: string }[] = [];
  const ownedIds: string[] = [];

  for (const product of products) {
    if (product.supplier_id !== user.id) {
      failed.push({ id: product.id, reason: t('noPermission') });
    } else {
      ownedIds.push(product.id);
    }
  }

  let updated = 0;
  if (ownedIds.length > 0) {
    const { error: updateErr, count } = await db(supabase)
      .from('products')
      .update({ status })
      .in('id', ownedIds)
      .select('id', { count: 'exact' });

    if (updateErr) return { data: null, error: t('updateError') };
    updated = count ?? ownedIds.length;
  }

  revalidatePath('/dashboard/products');
  revalidatePath('/products');
  return { data: { updated, failed }, error: null };
}

// ---------------------------------------------------------------------------
// BULK UPDATE PRODUCT PRICE (fixed-pricing only)
// ---------------------------------------------------------------------------
export async function bulkUpdateProductPrice(
  productIds: string[],
  price: number,
): Promise<ActionResult<{ updated: number; skipped: { id: string; reason: string }[] }>> {
  const t = await getTranslations('actions.products');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const rl = apiLimiter();
  const { success: rlOk } = await checkRateLimit(rl, user.id);
  if (!rlOk) return { data: null, error: t('tooManyRequests') };

  if (!productIds.length || productIds.length > 100 || price < 0.01) {
    return { data: null, error: t('invalidData') };
  }

  // Fetch products to check ownership and pricing model
  const { data: products } = await db(supabase)
    .from('products')
    .select('id, supplier_id, pricing_model')
    .in('id', productIds);

  if (!products) return { data: null, error: t('updateError') };

  const skipped: { id: string; reason: string }[] = [];
  const idsToUpdate: string[] = [];

  for (const product of products) {
    if (product.supplier_id !== user.id) {
      skipped.push({ id: product.id, reason: t('noPermission') });
    } else if (product.pricing_model !== 'fixed') {
      skipped.push({ id: product.id, reason: t('bulkPriceVariantSkip') });
    } else {
      idsToUpdate.push(product.id);
    }
  }

  let updated = 0;
  if (idsToUpdate.length > 0) {
    const { error: updateErr } = await db(supabase)
      .from('products')
      .update({ price })
      .in('id', idsToUpdate);

    if (updateErr) return { data: null, error: t('updateError') };
    updated = idsToUpdate.length;
  }

  revalidatePath('/dashboard/products');
  revalidatePath('/products');
  return { data: { updated, skipped }, error: null };
}

// ---------------------------------------------------------------------------
// BULK UPDATE PRODUCT STOCK
// ---------------------------------------------------------------------------
export async function bulkUpdateProductStock(
  productIds: string[],
  inStock: boolean,
  stockQuantity?: number,
): Promise<ActionResult<{ updated: number }>> {
  const t = await getTranslations('actions.products');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const rl = apiLimiter();
  const { success: rlOk } = await checkRateLimit(rl, user.id);
  if (!rlOk) return { data: null, error: t('tooManyRequests') };

  if (!productIds.length || productIds.length > 100) {
    return { data: null, error: t('invalidData') };
  }

  // Verify ownership
  const { data: products } = await db(supabase)
    .from('products')
    .select('id, supplier_id')
    .in('id', productIds);

  if (!products) return { data: null, error: t('updateError') };

  const ownedIds = products
    .filter((p: { supplier_id: string }) => p.supplier_id === user.id)
    .map((p: { id: string }) => p.id);

  if (ownedIds.length === 0) return { data: null, error: t('noPermission') };

  const updatePayload: { in_stock: boolean; stock_quantity?: number | null } = { in_stock: inStock };
  if (stockQuantity !== undefined) {
    updatePayload.stock_quantity = stockQuantity;
  }

  const { error: updateErr } = await db(supabase)
    .from('products')
    .update(updatePayload)
    .in('id', ownedIds);

  if (updateErr) return { data: null, error: t('updateError') };

  revalidatePath('/dashboard/products');
  revalidatePath('/products');
  return { data: { updated: ownedIds.length }, error: null };
}

// ---------------------------------------------------------------------------
// EXPORT PRODUCTS CSV
// ---------------------------------------------------------------------------
export async function exportProductsCsv(): Promise<ActionResult<{ csv: string; filename: string }>> {
  const t = await getTranslations('actions.products');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'supplier') {
    return { data: null, error: t('suppliersOnly') };
  }

  // Fetch all supplier products
  const { data: products } = await db(supabase)
    .from('products')
    .select('id, name_ar, name_en, description_ar, description_en, category_id, pricing_model, price, in_stock, stock_quantity, min_order_qty, lead_time_days, status, created_at')
    .eq('supplier_id', user.id)
    .order('created_at', { ascending: false });

  if (!products || products.length === 0) {
    return { data: null, error: t('noValidProducts') };
  }

  // Build CSV
  const headers = ['id', 'title_ar', 'title_en', 'description_ar', 'description_en', 'category_id', 'pricing_model', 'price', 'in_stock', 'stock_quantity', 'min_order_qty', 'lead_time_days', 'status', 'created_at'];
  const escapeCSV = (val: unknown) => {
    const str = val == null ? '' : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const rows = products.map((p: Record<string, unknown>) => [
    escapeCSV(p.id),
    escapeCSV(p.name_ar),
    escapeCSV(p.name_en),
    escapeCSV(p.description_ar),
    escapeCSV(p.description_en),
    escapeCSV(p.category_id),
    escapeCSV(p.pricing_model),
    escapeCSV(p.price),
    escapeCSV(p.in_stock),
    escapeCSV(p.stock_quantity),
    escapeCSV(p.min_order_qty),
    escapeCSV(p.lead_time_days),
    escapeCSV(p.status),
    escapeCSV(p.created_at),
  ].join(','));

  const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
  const filename = `products-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return { data: { csv, filename }, error: null };
}
