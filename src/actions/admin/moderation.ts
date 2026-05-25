// =============================================================================
// Muhandes HUB — Admin Moderation Actions
// =============================================================================
// ⚠️ All actions require is_admin = true. Uses Admin client for bypassing RLS.
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import type { ActionResult } from '@/types';
import { notifyPostApproved, notifyPostRejected } from '@/actions/notification-triggers';
import { getTypesenseClient } from '@/lib/typesense/client';

const TYPESENSE_COLLECTION: Record<'project' | 'product' | 'rfq', string> = {
  project: 'projects',
  product: 'products',
  rfq: 'rfqs',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

// ---------------------------------------------------------------------------
// Helper: verify admin
// ---------------------------------------------------------------------------
async function verifyAdmin(): Promise<{ adminId: string } | { error: string }> {
  const t = await getTranslations('actions.adminModeration');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: t('mustLogin') };

  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) return { error: t('adminOnly') };
  return { adminId: user.id };
}

// ---------------------------------------------------------------------------
// Helper: log admin action
// ---------------------------------------------------------------------------
async function logAudit(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> = {},
) {
  const adminClient = createAdminClient();
  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';

  await db(adminClient).from('admin_audit_log').insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
    ip_address: ip,
  });
}

// ---------------------------------------------------------------------------
// APPROVE POST
// ---------------------------------------------------------------------------
export async function approvePost(
  postId: string,
  postType: 'project' | 'product' | 'rfq',
): Promise<ActionResult<{ approved: boolean }>> {
  const t = await getTranslations('actions.adminModeration');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();
  const table = postType === 'project' ? 'projects' : postType === 'product' ? 'products' : 'rfqs';

  // Fetch post (including owner + title for notification)
  const { data: post, error: fetchError } = await db(adminClient)
    .from(table)
    .select('id, status, title_ar, title_en, owner_id, seller_id, poster_id')
    .eq('id', postId)
    .single();

  if (fetchError || !post) return { data: null, error: t('postNotFound') };
  if (!['draft', 'pending'].includes(post.status)) return { data: null, error: t('notPending') };

  // Update status → published
  const { error: updateError } = await db(adminClient)
    .from(table)
    .update({ status: 'published', approved_by: auth.adminId, approved_at: new Date().toISOString() })
    .eq('id', postId);

  if (updateError) return { data: null, error: t('approveError') };

  // Upsert into Typesense search index
  void (async () => {
    try {
      const ts = getTypesenseClient();
      if (ts) {
        const collection = TYPESENSE_COLLECTION[postType];
        const titleAr = post.title_ar ?? post.name_ar ?? '';
        const titleEn = post.title_en ?? post.name_en ?? '';
        await ts.collections(collection).documents().upsert({
          id: postId,
          title_ar: titleAr,
          title_en: titleEn,
          status: 'published',
          created_at: Math.floor(Date.now() / 1000),
        });
      }
    } catch { /* non-critical — manual reindex available */ }
  })();

  const ownerId: string = post.owner_id ?? post.seller_id ?? post.poster_id;
  if (ownerId) {
    void notifyPostApproved({
      userId: ownerId,
      postTitle: { ar: post.title_ar ?? '', en: post.title_en ?? '' },
      postType,
      postId,
    });
  }

  await logAudit(auth.adminId, 'approve_post', postType, postId, { status: 'published' });
  revalidatePath('/[locale]/admin/posts', 'page');

  return { data: { approved: true }, error: null };
}

// ---------------------------------------------------------------------------
// REJECT POST
// ---------------------------------------------------------------------------
export async function rejectPost(
  postId: string,
  postType: 'project' | 'product' | 'rfq',
  reasonAr: string,
  reasonEn: string,
): Promise<ActionResult<{ rejected: boolean }>> {
  const t = await getTranslations('actions.adminModeration');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();
  const table = postType === 'project' ? 'projects' : postType === 'product' ? 'products' : 'rfqs';

  // Fetch post (including owner + title for notification)
  const { data: post, error: fetchError } = await db(adminClient)
    .from(table)
    .select('id, status, title_ar, title_en, owner_id, seller_id, poster_id')
    .eq('id', postId)
    .single();

  if (fetchError || !post) return { data: null, error: t('postNotFound') };
  if (!['draft', 'pending'].includes(post.status)) return { data: null, error: t('notPending') };

  // Update status → rejected with reason
  const { error: updateError } = await db(adminClient)
    .from(table)
    .update({
      status: 'rejected',
      rejection_reason_ar: reasonAr,
      rejection_reason_en: reasonEn,
    })
    .eq('id', postId);

  if (updateError) return { data: null, error: t('rejectError') };

  // Remove from Typesense search index if it was previously indexed
  void (async () => {
    try {
      const ts = getTypesenseClient();
      if (ts) {
        await ts.collections(TYPESENSE_COLLECTION[postType]).documents(postId).delete();
      }
    } catch { /* document may not exist in index — ignore */ }
  })();

  const ownerId: string = post.owner_id ?? post.seller_id ?? post.poster_id;
  if (ownerId) {
    void notifyPostRejected({
      userId: ownerId,
      postTitle: { ar: post.title_ar ?? '', en: post.title_en ?? '' },
      postType,
      postId,
      reasonAr,
      reasonEn,
    });
  }

  await logAudit(auth.adminId, 'reject_post', postType, postId, { reason_ar: reasonAr, reason_en: reasonEn });
  revalidatePath('/[locale]/admin/posts', 'page');

  return { data: { rejected: true }, error: null };
}

// ---------------------------------------------------------------------------
// HIDE / UNHIDE REVIEW
// ---------------------------------------------------------------------------
export async function toggleReviewVisibility(
  reviewId: string,
  hide: boolean,
): Promise<ActionResult<{ hidden: boolean }>> {
  const t = await getTranslations('actions.adminModeration');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  const { error } = await db(adminClient)
    .from('reviews')
    .update({ is_hidden: hide })
    .eq('id', reviewId);

  if (error) return { data: null, error: t('toggleReviewError') };

  await logAudit(auth.adminId, hide ? 'hide_review' : 'unhide_review', 'review', reviewId);
  revalidatePath('/admin/reviews');

  return { data: { hidden: hide }, error: null };
}

// ---------------------------------------------------------------------------
// EDIT POST (admin can edit any post)
// ---------------------------------------------------------------------------
export async function adminEditPost(
  postId: string,
  postType: 'project' | 'product' | 'rfq',
  updates: {
    title_ar?: string;
    title_en?: string;
    description_ar?: string;
    description_en?: string;
  },
): Promise<ActionResult<{ updated: boolean }>> {
  const t = await getTranslations('actions.adminModeration');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();
  const table = postType === 'project' ? 'projects' : postType === 'product' ? 'products' : 'rfqs';

  // Build update object only with provided fields
  const updateData: Record<string, string> = {};
  if (updates.title_ar !== undefined) updateData.title_ar = updates.title_ar;
  if (updates.title_en !== undefined) updateData.title_en = updates.title_en;
  if (updates.description_ar !== undefined) updateData.description_ar = updates.description_ar;
  if (updates.description_en !== undefined) updateData.description_en = updates.description_en;

  if (Object.keys(updateData).length === 0) {
    return { data: null, error: t('noChanges') };
  }

  const { error: updateError } = await db(adminClient)
    .from(table)
    .update(updateData)
    .eq('id', postId);

  if (updateError) return { data: null, error: t('editError') };

  await logAudit(auth.adminId, 'edit_post', postType, postId, updateData);
  revalidatePath('/admin/posts');

  return { data: { updated: true }, error: null };
}

// ---------------------------------------------------------------------------
// GET POST DETAILS (for edit/detail page)
// ---------------------------------------------------------------------------
export async function getPostDetails(
  postId: string,
  postType: 'project' | 'product' | 'rfq',
): Promise<ActionResult<Record<string, unknown>>> {
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();
  const table = postType === 'project' ? 'projects' : postType === 'product' ? 'products' : 'rfqs';

  const { data, error } = await db(adminClient)
    .from(table)
    .select('*')
    .eq('id', postId)
    .single();

  if (error || !data) return { data: null, error: 'Post not found' };

  // Fetch related data based on post type
  if (postType === 'project') {
    const [filesResult, ownerResult, cityResult, categoryResult] = await Promise.all([
      db(adminClient)
        .from('project_files')
        .select('id, file_url, file_name, file_size, mime_type, category, created_at')
        .eq('project_id', postId)
        .order('created_at', { ascending: false }),
      db(adminClient)
        .from('profiles')
        .select('id, full_name, company_name_ar, company_name_en, email, phone, role')
        .eq('id', data.owner_id)
        .single(),
      data.city_id
        ? db(adminClient)
            .from('saudi_cities')
            .select('name_ar, name_en')
            .eq('id', data.city_id)
            .single()
        : Promise.resolve({ data: null }),
      data.category_id
        ? db(adminClient)
            .from('categories')
            .select('name_ar, name_en')
            .eq('id', data.category_id)
            .single()
        : Promise.resolve({ data: null }),
    ]);

    return {
      data: {
        ...data,
        files: filesResult.data ?? [],
        owner: ownerResult.data ?? null,
        city: cityResult.data ?? null,
        category: categoryResult.data ?? null,
      },
      error: null,
    };
  }

  if (postType === 'product') {
    const [imagesResult, variantsResult, specSheetsResult, ownerResult, categoryResult] = await Promise.all([
      db(adminClient)
        .from('product_images')
        .select('id, image_url, display_order, is_primary')
        .eq('product_id', postId)
        .order('display_order', { ascending: true }),
      db(adminClient)
        .from('product_variants')
        .select('id, name_ar, name_en, sku, price, stock_quantity')
        .eq('product_id', postId)
        .order('created_at', { ascending: true }),
      db(adminClient)
        .from('product_spec_sheets')
        .select('id, file_url, file_name, file_size')
        .eq('product_id', postId),
      data.supplier_id
        ? db(adminClient)
            .from('profiles')
            .select('id, full_name, company_name_ar, company_name_en, email, phone, role')
            .eq('id', data.supplier_id)
            .single()
        : Promise.resolve({ data: null }),
      data.category_id
        ? db(adminClient)
            .from('categories')
            .select('name_ar, name_en')
            .eq('id', data.category_id)
            .single()
        : Promise.resolve({ data: null }),
    ]);

    return {
      data: {
        ...data,
        // Normalize title fields for the view component
        title_ar: data.name_ar,
        title_en: data.name_en,
        images: imagesResult.data ?? [],
        variants: variantsResult.data ?? [],
        spec_sheets: specSheetsResult.data ?? [],
        owner: ownerResult.data ?? null,
        category: categoryResult.data ?? null,
      },
      error: null,
    };
  }

  // RFQ
  const promises: Promise<{ data: unknown }>[] = [
    data.poster_id
      ? db(adminClient)
          .from('profiles')
          .select('id, full_name, company_name_ar, company_name_en, email, phone, role')
          .eq('id', data.poster_id)
          .single()
      : Promise.resolve({ data: null }),
    data.city_id
      ? db(adminClient)
          .from('saudi_cities')
          .select('name_ar, name_en')
          .eq('id', data.city_id)
          .single()
      : Promise.resolve({ data: null }),
    data.category_id
      ? db(adminClient)
          .from('categories')
          .select('name_ar, name_en')
          .eq('id', data.category_id)
          .single()
      : Promise.resolve({ data: null }),
    db(adminClient)
      .from('rfq_files')
      .select('id, file_url, file_name, file_size, mime_type, category')
      .eq('rfq_id', postId)
      .order('created_at', { ascending: false }),
  ];

  const [ownerResult, cityResult, categoryResult, rfqFilesResult] = await Promise.all(promises);

  return {
    data: {
      ...data,
      owner: (ownerResult as { data: unknown }).data ?? null,
      city: (cityResult as { data: unknown }).data ?? null,
      category: (categoryResult as { data: unknown }).data ?? null,
      files: (rfqFilesResult as { data: unknown[] }).data ?? [],
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// ADMIN UPDATE PROJECT (full form — all fields + status)
// ---------------------------------------------------------------------------
export async function adminUpdateProject(
  _prevState: ActionResult<{ id: string; status?: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string; status?: string }>> {
  const t = await getTranslations('actions.adminModeration');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const projectId = formData.get('project_id') as string;
  if (!projectId) return { data: null, error: t('postNotFound') };

  const adminClient = createAdminClient();

  // Build update payload from form fields
  const updateData: Record<string, unknown> = {};

  const textFields = ['title_ar', 'title_en', 'description_ar', 'description_en', 'external_link'] as const;
  for (const field of textFields) {
    const val = formData.get(field);
    if (val !== null) updateData[field] = (val as string) || null;
  }

  const status = formData.get('status') as string;
  if (status && ['draft', 'pending', 'published', 'rejected'].includes(status)) {
    updateData.status = status;
    if (status === 'published') {
      updateData.approved_by = auth.adminId;
      updateData.approved_at = new Date().toISOString();
    }
  }

  // City resolution
  const city = formData.get('city') as string;
  if (city) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(city)) {
      updateData.city_id = city;
    } else {
      const { data: cityRow } = await db(adminClient).from('saudi_cities').select('id').ilike('name_en', city).single();
      updateData.city_id = cityRow?.id ?? null;
    }
  }

  // Numeric fields
  const budgetMin = formData.get('budget_min');
  const budgetMax = formData.get('budget_max');
  if (budgetMin !== null) updateData.budget_min = budgetMin ? parseFloat(budgetMin as string) : null;
  if (budgetMax !== null) updateData.budget_max = budgetMax ? parseFloat(budgetMax as string) : null;

  // Date fields
  const timelineStart = formData.get('timeline_start') as string;
  const timelineEnd = formData.get('timeline_end') as string;
  if (timelineStart !== null) updateData.timeline_start = timelineStart || null;
  if (timelineEnd !== null) updateData.timeline_end = timelineEnd || null;

  // Select fields
  const classification = formData.get('classification') as string;
  if (classification !== null) updateData.classification = classification || null;
  const source = formData.get('source') as string;
  if (source) updateData.source = source;
  const categoryId = formData.get('category_id') as string;
  if (categoryId !== null) updateData.category_id = categoryId || null;

  if (Object.keys(updateData).length === 0) {
    return { data: null, error: t('noChanges') };
  }

  const { error: updateError } = await db(adminClient)
    .from('projects')
    .update(updateData)
    .eq('id', projectId);

  if (updateError) return { data: null, error: t('editError') };

  // Upload new files if any
  const projectFiles = formData.getAll('project_files') as File[];
  const fileCategory = (formData.get('file_category') as string) || 'general';
  if (projectFiles.length > 0) {
    const { uploadFile: doUpload } = await import('@/actions/uploads');
    for (const file of projectFiles) {
      if (!file || file.size === 0) continue;
      const uploadResult = await doUpload('project-files', file, `${projectId}/${fileCategory}-${Date.now()}`);
      if (uploadResult.data) {
        await db(adminClient).from('project_files').insert({
          project_id: projectId,
          file_url: uploadResult.data.url,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          category: fileCategory,
        });
      }
    }
  }

  await logAudit(auth.adminId, 'admin_update_project', 'project', projectId, updateData);
  revalidatePath('/[locale]/admin/posts', 'page');
  revalidatePath('/[locale]/dashboard/projects', 'page');

  return { data: { id: projectId, status: status || undefined }, error: null };
}

// ---------------------------------------------------------------------------
// ADMIN UPDATE PRODUCT (full form — all fields + status)
// ---------------------------------------------------------------------------
export async function adminUpdateProduct(
  _prevState: ActionResult<{ id: string; status?: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string; status?: string }>> {
  const t = await getTranslations('actions.adminModeration');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const productId = formData.get('product_id') as string;
  if (!productId) return { data: null, error: t('postNotFound') };

  const adminClient = createAdminClient();

  const updateData: Record<string, unknown> = {};

  // Text fields (products use name_ar/name_en)
  const nameAr = formData.get('name_ar');
  const nameEn = formData.get('name_en');
  if (nameAr !== null) updateData.name_ar = (nameAr as string) || null;
  if (nameEn !== null) updateData.name_en = (nameEn as string) || null;
  const descAr = formData.get('description_ar');
  const descEn = formData.get('description_en');
  if (descAr !== null) updateData.description_ar = (descAr as string) || null;
  if (descEn !== null) updateData.description_en = (descEn as string) || null;

  // Status
  const status = formData.get('status') as string;
  if (status && ['draft', 'pending', 'published', 'rejected'].includes(status)) {
    updateData.status = status;
    if (status === 'published') {
      updateData.approved_by = auth.adminId;
      updateData.approved_at = new Date().toISOString();
    }
  }

  // Pricing
  const pricingModel = formData.get('pricing_model') as string;
  if (pricingModel) updateData.pricing_model = pricingModel;
  const price = formData.get('price');
  if (price !== null) updateData.price = price ? parseFloat(price as string) : null;

  // Stock
  const inStock = formData.get('in_stock') as string;
  if (inStock !== null) updateData.in_stock = inStock === 'true';
  const stockQty = formData.get('stock_quantity');
  if (stockQty !== null) updateData.stock_quantity = stockQty ? parseInt(stockQty as string) : null;
  const minOrder = formData.get('min_order_qty');
  if (minOrder !== null) updateData.min_order_qty = minOrder ? parseInt(minOrder as string) : null;
  const leadTime = formData.get('lead_time_days');
  if (leadTime !== null) updateData.lead_time_days = leadTime ? parseInt(leadTime as string) : null;

  // Category
  const categoryId = formData.get('category_id') as string;
  if (categoryId !== null) updateData.category_id = categoryId || null;

  if (Object.keys(updateData).length === 0) {
    return { data: null, error: t('noChanges') };
  }

  const { error: updateError } = await db(adminClient)
    .from('products')
    .update(updateData)
    .eq('id', productId);

  if (updateError) return { data: null, error: t('editError') };

  // Handle variants if pricing_model=variant
  const variantsJson = formData.get('variants') as string;
  if (variantsJson) {
    try {
      const variantsData = JSON.parse(variantsJson) as Array<{
        name_ar?: string; name_en?: string; sku?: string; price: number; stock_quantity?: number; sort_order: number;
      }>;
      // Delete existing variants and re-insert
      await db(adminClient).from('product_variants').delete().eq('product_id', productId);
      if (variantsData.length > 0) {
        await db(adminClient).from('product_variants').insert(
          variantsData.map((v) => ({
            product_id: productId,
            name_ar: v.name_ar || null,
            name_en: v.name_en || null,
            sku: v.sku || null,
            price: v.price,
            stock_quantity: v.stock_quantity ?? null,
            sort_order: v.sort_order,
          })),
        );
      }
    } catch { /* ignore parse errors */ }
  }

  // Upload new images
  const imageFiles = formData.getAll('image_files') as File[];
  if (imageFiles.length > 0) {
    const { uploadFile: doUpload } = await import('@/actions/uploads');
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      if (!file || file.size === 0) continue;
      const uploadResult = await doUpload('product-images', file, `${productId}/img-${Date.now()}-${i}`);
      if (uploadResult.data) {
        await db(adminClient).from('product_images').insert({
          product_id: productId,
          image_url: uploadResult.data.url,
          display_order: i,
          is_primary: i === 0,
        });
      }
    }
  }

  // Upload new spec sheets
  const specFiles = formData.getAll('spec_files') as File[];
  if (specFiles.length > 0) {
    const { uploadFile: doUpload } = await import('@/actions/uploads');
    for (const file of specFiles) {
      if (!file || file.size === 0) continue;
      const uploadResult = await doUpload('product-specs', file, `${productId}/spec-${Date.now()}`);
      if (uploadResult.data) {
        await db(adminClient).from('product_spec_sheets').insert({
          product_id: productId,
          file_url: uploadResult.data.url,
          file_name: file.name,
          file_size: file.size,
        });
      }
    }
  }

  await logAudit(auth.adminId, 'admin_update_product', 'product', productId, updateData);
  revalidatePath('/[locale]/admin/posts', 'page');
  revalidatePath('/[locale]/dashboard/products', 'page');

  return { data: { id: productId, status: status || undefined }, error: null };
}

// ---------------------------------------------------------------------------
// ADMIN UPDATE RFQ (full form — all fields + status)
// ---------------------------------------------------------------------------
export async function adminUpdateRFQ(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.adminModeration');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const rfqId = formData.get('rfq_id') as string;
  if (!rfqId) return { data: null, error: t('postNotFound') };

  const adminClient = createAdminClient();
  const updateData: Record<string, unknown> = {};

  const textFields = ['title_ar', 'title_en', 'description_ar', 'description_en'] as const;
  for (const field of textFields) {
    const val = formData.get(field);
    if (val !== null) updateData[field] = (val as string) || null;
  }

  // Status (RFQ statuses)
  const status = formData.get('status') as string;
  if (status && ['draft', 'pending', 'published', 'rejected', 'closed'].includes(status)) {
    updateData.status = status;
  }

  // Numeric
  const quantity = formData.get('quantity');
  if (quantity !== null) updateData.quantity = quantity ? parseInt(quantity as string) : null;
  const budgetMin = formData.get('budget_min');
  const budgetMax = formData.get('budget_max');
  if (budgetMin !== null) updateData.budget_min = budgetMin ? parseFloat(budgetMin as string) : null;
  if (budgetMax !== null) updateData.budget_max = budgetMax ? parseFloat(budgetMax as string) : null;

  // Date
  const deadline = formData.get('deadline') as string;
  if (deadline !== null) updateData.deadline = deadline || null;

  // City
  const city = formData.get('city') as string;
  if (city) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(city)) {
      updateData.city_id = city;
    } else {
      const { data: cityRow } = await db(adminClient).from('saudi_cities').select('id').ilike('name_en', city).single();
      updateData.city_id = cityRow?.id ?? null;
    }
  }

  // Product ID
  const productId = formData.get('product_id') as string;
  if (productId !== null) updateData.product_id = productId || null;

  if (Object.keys(updateData).length === 0) {
    return { data: null, error: t('noChanges') };
  }

  const { error: updateError } = await db(adminClient)
    .from('rfqs')
    .update(updateData)
    .eq('id', rfqId);

  if (updateError) return { data: null, error: t('editError') };

  // Upload new files
  const rfqFiles = formData.getAll('rfq_files') as File[];
  const fileCategory = (formData.get('file_category') as string) || 'general';
  if (rfqFiles.length > 0) {
    const { uploadFile: doUpload } = await import('@/actions/uploads');
    for (const file of rfqFiles) {
      if (!file || file.size === 0) continue;
      const uploadResult = await doUpload('rfq-files', file, `${rfqId}/${fileCategory}-${Date.now()}`);
      if (uploadResult.data) {
        await db(adminClient).from('rfq_files').insert({
          rfq_id: rfqId,
          file_url: uploadResult.data.url,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          category: fileCategory,
        });
      }
    }
  }

  await logAudit(auth.adminId, 'admin_update_rfq', 'rfq', rfqId, updateData);
  revalidatePath('/[locale]/admin/rfqs', 'page');
  revalidatePath('/[locale]/dashboard/rfqs', 'page');

  return { data: { id: rfqId }, error: null };
}

// ---------------------------------------------------------------------------
// ADMIN UPDATE BID (all fields + status)
// ---------------------------------------------------------------------------
export async function adminUpdateBid(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.adminModeration');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const bidId = formData.get('bid_id') as string;
  if (!bidId) return { data: null, error: t('postNotFound') };

  const adminClient = createAdminClient();
  const updateData: Record<string, unknown> = {};

  const amount = formData.get('amount');
  if (amount !== null) updateData.amount = amount ? parseFloat(amount as string) : null;
  const timelineDays = formData.get('timeline_days');
  if (timelineDays !== null) updateData.timeline_days = timelineDays ? parseInt(timelineDays as string) : null;
  const methodologyAr = formData.get('methodology_ar');
  if (methodologyAr !== null) updateData.methodology_ar = (methodologyAr as string) || null;
  const methodologyEn = formData.get('methodology_en');
  if (methodologyEn !== null) updateData.methodology_en = (methodologyEn as string) || null;

  const status = formData.get('status') as string;
  if (status && ['pending', 'shortlisted', 'awarded', 'rejected', 'cancelled'].includes(status)) {
    updateData.status = status;
  }

  if (Object.keys(updateData).length === 0) {
    return { data: null, error: t('noChanges') };
  }

  const { error: updateError } = await db(adminClient)
    .from('bids')
    .update(updateData)
    .eq('id', bidId);

  if (updateError) return { data: null, error: t('editError') };

  await logAudit(auth.adminId, 'admin_update_bid', 'bid', bidId, updateData);
  revalidatePath('/[locale]/admin/bids', 'page');
  revalidatePath('/[locale]/dashboard/bids', 'page');

  return { data: { id: bidId }, error: null };
}

// ---------------------------------------------------------------------------
// ADMIN UPDATE QUOTATION (all fields + status)
// ---------------------------------------------------------------------------
export async function adminUpdateQuotation(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.adminModeration');
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const quotationId = formData.get('quotation_id') as string;
  if (!quotationId) return { data: null, error: t('postNotFound') };

  const adminClient = createAdminClient();
  const updateData: Record<string, unknown> = {};

  // Text fields
  const textFields = ['client_name', 'project_ref', 'payment_terms_ar', 'payment_terms_en', 'delivery_terms_ar', 'delivery_terms_en', 'notes_ar', 'notes_en'] as const;
  for (const field of textFields) {
    const val = formData.get(field);
    if (val !== null) updateData[field] = (val as string) || null;
  }

  // Status
  const status = formData.get('status') as string;
  if (status && ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'].includes(status)) {
    updateData.status = status;
    if (status === 'accepted') {
      updateData.accepted_at = new Date().toISOString();
    }
  }

  // Validity days
  const validityDays = formData.get('validity_days');
  if (validityDays !== null) updateData.validity_days = validityDays ? parseInt(validityDays as string) : null;

  // Line items + totals recalculation
  const lineItemsJson = formData.get('line_items') as string;
  if (lineItemsJson) {
    try {
      const rawItems = JSON.parse(lineItemsJson);
      const items = rawItems.map((item: { quantity: number; unit_price: number; description: string; unit: string }) => ({
        ...item,
        total: item.quantity * item.unit_price,
      }));
      updateData.line_items = items;
      const subtotal = items.reduce((sum: number, item: { total: number }) => sum + item.total, 0);
      const vatAmount = subtotal * 0.15; // ZATCA 15%
      updateData.subtotal = subtotal;
      updateData.vat_amount = vatAmount;
      updateData.total = subtotal + vatAmount;
    } catch { /* ignore parse errors */ }
  }

  if (Object.keys(updateData).length === 0) {
    return { data: null, error: t('noChanges') };
  }

  const { error: updateError } = await db(adminClient)
    .from('quotations')
    .update(updateData)
    .eq('id', quotationId);

  if (updateError) return { data: null, error: t('editError') };

  await logAudit(auth.adminId, 'admin_update_quotation', 'quotation', quotationId, updateData);
  revalidatePath('/[locale]/admin/quotations', 'page');
  revalidatePath('/[locale]/dashboard/quotations', 'page');

  return { data: { id: quotationId }, error: null };
}

// ---------------------------------------------------------------------------
// ADMIN: Get Bid Details (for admin bid management)
// ---------------------------------------------------------------------------
export async function getBidDetails(
  bidId: string,
): Promise<ActionResult<Record<string, unknown>>> {
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  const { data: bid, error } = await db(adminClient)
    .from('bids')
    .select('*')
    .eq('id', bidId)
    .single();

  if (error || !bid) return { data: null, error: 'Bid not found' };

  // Fetch related data
  const [projectResult, contractorResult] = await Promise.all([
    db(adminClient)
      .from('projects')
      .select('id, title_ar, title_en, slug_ar, slug_en')
      .eq('id', bid.project_id)
      .single(),
    db(adminClient)
      .from('profiles')
      .select('id, full_name, company_name_ar, company_name_en, email, phone, role')
      .eq('id', bid.contractor_id)
      .single(),
  ]);

  return {
    data: {
      ...bid,
      project: projectResult.data ?? null,
      contractor: contractorResult.data ?? null,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// ADMIN: Get Quotation Details (for admin quotation management)
// ---------------------------------------------------------------------------
export async function getQuotationDetails(
  quotationId: string,
): Promise<ActionResult<Record<string, unknown>>> {
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  const { data: quotation, error } = await db(adminClient)
    .from('quotations')
    .select('*')
    .eq('id', quotationId)
    .single();

  if (error || !quotation) return { data: null, error: 'Quotation not found' };

  // Fetch related data
  const [senderResult, recipientResult] = await Promise.all([
    db(adminClient)
      .from('profiles')
      .select('id, full_name, company_name_ar, company_name_en, email, phone, role')
      .eq('id', quotation.sender_id)
      .single(),
    quotation.recipient_id
      ? db(adminClient)
          .from('profiles')
          .select('id, full_name, company_name_ar, company_name_en, email, phone, role')
          .eq('id', quotation.recipient_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  return {
    data: {
      ...quotation,
      sender: senderResult.data ?? null,
      recipient: recipientResult.data ?? null,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// ADMIN: List All Bids (with filters)
// ---------------------------------------------------------------------------
export async function listAllBids(
  filters?: { status?: string; projectId?: string; search?: string },
): Promise<ActionResult<Record<string, unknown>[]>> {
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();
  let query = db(adminClient)
    .from('bids')
    .select('id, amount, timeline_days, status, created_at, contractor_id, project_id, profiles!bids_contractor_id_fkey(full_name, company_name_ar, company_name_en), projects!bids_project_id_fkey(title_ar, title_en)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.projectId) query = query.eq('project_id', filters.projectId);

  const { data, error } = await query;
  if (error) return { data: null, error: 'Failed to fetch bids' };

  return { data: data ?? [], error: null };
}

// ---------------------------------------------------------------------------
// ADMIN: List All Quotations (with filters)
// ---------------------------------------------------------------------------
export async function listAllQuotations(
  filters?: { status?: string; search?: string },
): Promise<ActionResult<Record<string, unknown>[]>> {
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();
  let query = db(adminClient)
    .from('quotations')
    .select('id, number, total, status, created_at, sender_id, recipient_id, client_name, profiles!quotations_sender_id_fkey(full_name, company_name_ar, company_name_en)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) return { data: null, error: 'Failed to fetch quotations' };

  return { data: data ?? [], error: null };
}

// ---------------------------------------------------------------------------
// ADMIN: List All RFQs (with filters)
// ---------------------------------------------------------------------------
export async function listAllRFQs(
  filters?: { status?: string; search?: string },
): Promise<ActionResult<Record<string, unknown>[]>> {
  const auth = await verifyAdmin();
  if ('error' in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();
  let query = db(adminClient)
    .from('rfqs')
    .select('id, title_ar, title_en, status, created_at, poster_id, deadline, quantity, budget_min, budget_max, profiles!rfqs_poster_id_fkey(full_name, company_name_ar, company_name_en)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) return { data: null, error: 'Failed to fetch RFQs' };

  return { data: data ?? [], error: null };
}
