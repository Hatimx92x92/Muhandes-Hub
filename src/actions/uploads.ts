// =============================================================================
// Muhandes HUB — File Upload Utilities (Supabase Storage)
// =============================================================================

'use server';

import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { apiLimiter, checkRateLimit } from '@/lib/rate-limit';
import type { ActionResult } from '@/types';

// ---------------------------------------------------------------------------
// Allowed MIME types by bucket
// ---------------------------------------------------------------------------

const ALLOWED_IMAGES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOCUMENTS = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const ALLOWED_SPECS = [...ALLOWED_DOCUMENTS, ...ALLOWED_IMAGES];

const BUCKET_CONFIG: Record<string, { allowed: string[]; maxSize: number }> = {
  avatars: { allowed: ALLOWED_IMAGES, maxSize: 5 * 1024 * 1024 }, // 5MB
  logos: { allowed: ALLOWED_IMAGES, maxSize: 5 * 1024 * 1024 },
  'project-files': { allowed: [...ALLOWED_DOCUMENTS, ...ALLOWED_IMAGES], maxSize: 10 * 1024 * 1024 }, // 10MB
  'product-images': { allowed: ALLOWED_IMAGES, maxSize: 5 * 1024 * 1024 },
  'product-specs': { allowed: ALLOWED_SPECS, maxSize: 10 * 1024 * 1024 },
  'rfq-files': { allowed: [...ALLOWED_DOCUMENTS, ...ALLOWED_IMAGES], maxSize: 10 * 1024 * 1024 }, // 10MB
  'deal-proofs': { allowed: [...ALLOWED_DOCUMENTS, ...ALLOWED_IMAGES], maxSize: 10 * 1024 * 1024 },
  'deal-documents': { allowed: [...ALLOWED_DOCUMENTS, ...ALLOWED_IMAGES], maxSize: 10 * 1024 * 1024 },
  'verification-docs': { allowed: ALLOWED_DOCUMENTS, maxSize: 10 * 1024 * 1024 },
  'message-attachments': { allowed: [...ALLOWED_DOCUMENTS, ...ALLOWED_IMAGES], maxSize: 10 * 1024 * 1024 },
  'site-log-photos': { allowed: ALLOWED_IMAGES, maxSize: 5 * 1024 * 1024 },
  'company-documents': { allowed: ['application/pdf'], maxSize: 10 * 1024 * 1024 }, // 10MB PDF only
  'bank-payments': { allowed: [...ALLOWED_DOCUMENTS, ...ALLOWED_IMAGES], maxSize: 10 * 1024 * 1024 }, // 10MB
};

// ---------------------------------------------------------------------------
// UPLOAD FILE — generic upload to any bucket
// ---------------------------------------------------------------------------

export async function uploadFile(
  bucket: string,
  file: File,
  path: string,
): Promise<ActionResult<{ url: string; path: string }>> {
  const t = await getTranslations('actions.uploads');
  // 1. Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // 1b. Rate limit
  const rl = apiLimiter();
  const { success: rlOk } = await checkRateLimit(rl, user.id);
  if (!rlOk) return { data: null, error: t('tooManyRequests') };

  // 2. Validate bucket
  const config = BUCKET_CONFIG[bucket];
  if (!config) return { data: null, error: t('invalidBucket') };

  // 3. Validate file size
  if (file.size > config.maxSize) {
    const maxMB = config.maxSize / (1024 * 1024);
    return { data: null, error: t('fileTooLarge', { maxMB }) };
  }

  // 4. Validate MIME type (server-side security)
  if (!config.allowed.includes(file.type)) {
    return { data: null, error: t('invalidFileType') };
  }

  // 5. Generate safe file path
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const safePath = `${user.id}/${path}.${ext}`;

  // 6. Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(safePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return { data: null, error: t('uploadError') };
  }

  // 7. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(safePath);

  return { data: { url: publicUrl, path: safePath }, error: null };
}

// ---------------------------------------------------------------------------
// UPLOAD AVATAR
// ---------------------------------------------------------------------------

export async function uploadAvatar(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const t = await getTranslations('actions.uploads');
  const file = formData.get('avatar') as File | null;
  if (!file || file.size === 0) return { data: null, error: t('noFileSelected') };

  const result = await uploadFile('avatars', file, `avatar-${Date.now()}`);
  if (result.error) return { data: null, error: result.error };

  // Update profile
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ avatar_url: result.data!.url })
    .eq('id', user.id);

  if (error) return { data: null, error: t('updateAvatarError') };

  return { data: { url: result.data!.url }, error: null };
}

// ---------------------------------------------------------------------------
// UPLOAD COMPANY LOGO
// ---------------------------------------------------------------------------

export async function uploadLogo(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const t = await getTranslations('actions.uploads');
  const file = formData.get('logo') as File | null;
  if (!file || file.size === 0) return { data: null, error: t('noFileSelected') };

  const result = await uploadFile('logos', file, `logo-${Date.now()}`);
  if (result.error) return { data: null, error: result.error };

  // Update profile
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ logo_url: result.data!.url })
    .eq('id', user.id);

  if (error) return { data: null, error: t('updateLogoError') };

  return { data: { url: result.data!.url }, error: null };
}

// ---------------------------------------------------------------------------
// UPLOAD PROJECT FILES (BOQ, drawings, specs)
// ---------------------------------------------------------------------------

export async function uploadProjectFiles(
  projectId: string,
  formData: FormData,
): Promise<ActionResult<{ urls: string[] }>> {
  const t = await getTranslations('actions.uploads');
  const files = formData.getAll('files') as File[];
  if (!files.length) return { data: null, error: t('noFilesSelected') };

  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const result = await uploadFile('project-files', files[i], `${projectId}/${Date.now()}-${i}`);
    if (result.error) return { data: null, error: result.error };
    urls.push(result.data!.url);
  }

  return { data: { urls }, error: null };
}

// ---------------------------------------------------------------------------
// UPLOAD PRODUCT IMAGES
// ---------------------------------------------------------------------------

export async function uploadProductImages(
  productId: string,
  formData: FormData,
): Promise<ActionResult<{ urls: string[] }>> {
  const t = await getTranslations('actions.uploads');
  const files = formData.getAll('images') as File[];
  if (!files.length) return { data: null, error: t('noImagesSelected') };

  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const result = await uploadFile('product-images', files[i], `${productId}/${Date.now()}-${i}`);
    if (result.error) return { data: null, error: result.error };
    urls.push(result.data!.url);
  }

  return { data: { urls }, error: null };
}

// ---------------------------------------------------------------------------
// UPLOAD PRODUCT SPEC SHEET
// ---------------------------------------------------------------------------

export async function uploadProductSpec(
  productId: string,
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const t = await getTranslations('actions.uploads');
  const file = formData.get('spec') as File | null;
  if (!file || file.size === 0) return { data: null, error: t('noFileSelected') };

  const result = await uploadFile('product-specs', file, `${productId}/spec-${Date.now()}`);
  if (result.error) return { data: null, error: result.error };

  return { data: { url: result.data!.url }, error: null };
}

// ---------------------------------------------------------------------------
// UPLOAD VERIFICATION DOCUMENTS
// ---------------------------------------------------------------------------

export async function uploadVerificationDocument(
  formData: FormData,
): Promise<ActionResult<{ url: string; documentType: string }>> {
  const t = await getTranslations('actions.uploads');
  const file = formData.get('document') as File | null;
  const documentType = formData.get('document_type') as string | null;
  if (!file || file.size === 0) return { data: null, error: t('noFileSelected') };
  if (!documentType) return { data: null, error: t('documentTypeRequired') };

  const result = await uploadFile('verification-docs', file, `${documentType}-${Date.now()}`);
  if (result.error) return { data: null, error: result.error };

  // Store document reference in DB
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('verification_documents')
    .insert({
      user_id: user.id,
      document_type: documentType,
      file_url: result.data!.url,
      status: 'pending',
    });

  return { data: { url: result.data!.url, documentType }, error: null };
}

// ---------------------------------------------------------------------------
// UPLOAD DEAL PROOF FILE
// ---------------------------------------------------------------------------

export async function uploadDealProof(
  dealId: string,
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const t = await getTranslations('actions.uploads');
  const file = formData.get('proof') as File | null;
  if (!file || file.size === 0) return { data: null, error: t('noFileSelected') };

  const result = await uploadFile('deal-proofs', file, `${dealId}/proof-${Date.now()}`);
  if (result.error) return { data: null, error: result.error };

  return { data: { url: result.data!.url }, error: null };
}

// ---------------------------------------------------------------------------
// UPLOAD DEAL DOCUMENT (Document Vault)
// ---------------------------------------------------------------------------

export async function uploadDealDocument(
  dealId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string; url: string }>> {
  const t = await getTranslations('actions.uploads');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const file = formData.get('document') as File | null;
  if (!file || file.size === 0) return { data: null, error: t('noFileSelected') };

  const category = (formData.get('category') as string) || 'general';
  const notes = (formData.get('notes') as string) || null;

  const result = await uploadFile('deal-documents', file, `${dealId}/doc-${Date.now()}`);
  if (result.error) return { data: null, error: result.error };

  // Insert record into deal_documents table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: doc, error: dbError } = await (supabase as any)
    .from('deal_documents')
    .insert({
      deal_id: dealId,
      uploader_id: user.id,
      category,
      file_url: result.data!.url,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      notes,
    })
    .select('id')
    .single();

  if (dbError) return { data: null, error: t('uploadError') };

  const { revalidatePath } = await import('next/cache');
  revalidatePath(`/dashboard/deals`);

  return { data: { id: doc.id, url: result.data!.url }, error: null };
}
