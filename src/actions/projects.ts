// =============================================================================
// Muhandes HUB â€” Project Server Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';
import { localizeFieldErrors } from '@/lib/zod-i18n';
import { ProjectSchema, UpdateProjectSchema } from '@/schemas/project';
import { apiLimiter, checkRateLimit } from '@/lib/rate-limit';
import type { ActionResult } from '@/types';
import { generateUniqueSlug } from '@/lib/utils';
import { autoTranslateBilingualFields } from '@/lib/translate';

// Temporary helper: cast supabase for table queries until types are generated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: Awaited<ReturnType<typeof createClient>>): any {
  return supabase;
}

// ---------------------------------------------------------------------------
// Helper: parse Zod issues into fieldErrors
// ---------------------------------------------------------------------------
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
// CREATE PROJECT
// ---------------------------------------------------------------------------
export async function createProject(
  _prevState: ActionResult<{ id: string; status: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string; status: string }>> {
  const t = await getTranslations('actions.projects');

  // 1. Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: t('mustLogin') };
  }

  // 1b. Rate limit
  const rl = apiLimiter();
  const { success: rlOk } = await checkRateLimit(rl, user.id);
  if (!rlOk) return { data: null, error: t('tooManyRequests') };

  // 2. Role check
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['project_owner', 'contractor'].includes(profile.role)) {
    return { data: null, error: t('noPermissionCreate') };
  }

  // 3. Validate
  const raw = {
    title_ar: formData.get('title_ar'),
    title_en: formData.get('title_en'),
    description_ar: formData.get('description_ar'),
    description_en: formData.get('description_en'),
    category_id: formData.get('category_id') || undefined,
    city: formData.get('city'),
    budget_min: formData.get('budget_min') || undefined,
    budget_max: formData.get('budget_max') || undefined,
    timeline_start: formData.get('timeline_start') || undefined,
    timeline_end: formData.get('timeline_end') || undefined,
    classification: formData.get('classification') || undefined,
    source: formData.get('source') || 'owner',
  };

  const parsed = ProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: await toFieldErrors(parsed.error.issues) };
  }

  // 3b. Auto-translate missing bilingual fields
  const translated = await autoTranslateBilingualFields(parsed.data as Record<string, unknown>, ['title', 'description']);

  // 4. Generate slugs
  const [slug_ar, slug_en] = await Promise.all([
    generateUniqueSlug((translated.title_ar as string) || parsed.data.title_ar || '', 'projects', 'slug_ar', db(supabase)),
    generateUniqueSlug((translated.title_en as string) || parsed.data.title_en || '', 'projects', 'slug_en', db(supabase)),
  ]);

  // 5. Resolve city slug to UUID
  let cityId: string | null = null;
  if (parsed.data.city) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(parsed.data.city)) {
      cityId = parsed.data.city;
    } else {
      const { data: cityRow } = await (db(supabase) as { from: (t: string) => { select: (s: string) => { ilike: (col: string, val: string) => { single: () => Promise<{ data: { id: string } | null }> } } } }).from('saudi_cities').select('id').ilike('name_en', parsed.data.city).single();
      cityId = cityRow?.id ?? null;
    }
  }

  // 5b. Insert project
  const { data: project, error: insertErr } = await db(supabase)
    .from('projects')
    .insert({
      owner_id: user.id,
      title_ar: (translated.title_ar as string) || parsed.data.title_ar || '',
      title_en: (translated.title_en as string) || parsed.data.title_en || '',
      description_ar: (translated.description_ar as string) || parsed.data.description_ar || '',
      description_en: (translated.description_en as string) || parsed.data.description_en || '',
      category_id: parsed.data.category_id || null,
      city_id: cityId,
      budget_min: parsed.data.budget_min ?? null,
      budget_max: parsed.data.budget_max ?? null,
      timeline_start: parsed.data.timeline_start || null,
      timeline_end: parsed.data.timeline_end || null,
      classification: parsed.data.classification || null,
      source: parsed.data.source,
      slug_ar,
      slug_en,
      status: 'draft',
    })
    .select('id, status')
    .single();

  if (insertErr || !project) {
    console.error('Project insert error:', insertErr);
    return { data: null, error: t('createError') };
  }

  // 5. Revalidate
  revalidatePath('/dashboard/projects');

  // 6. Upload project files from FormData
  const projectFiles = formData.getAll('project_files') as File[];
  const fileCategory = (formData.get('file_category') as string) || 'general';
  if (projectFiles.length > 0) {
    const { uploadFile: doUpload } = await import('@/actions/uploads');
    for (const file of projectFiles) {
      if (!file || file.size === 0) continue;
      const uploadResult = await doUpload('project-files', file, `${project.id}/${fileCategory}-${Date.now()}`);
      if (uploadResult.data) {
        await db(supabase).from('project_files').insert({
          project_id: project.id,
          file_url: uploadResult.data.url,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          category: fileCategory,
        });
      }
    }
  }

  return { data: { id: project.id, status: project.status }, error: null };
}

// ---------------------------------------------------------------------------
// UPDATE PROJECT (draft/rejected only)
// ---------------------------------------------------------------------------
export async function updateProject(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.projects');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: t('mustLogin') };
  }

  const raw = {
    project_id: formData.get('project_id'),
    title_ar: formData.get('title_ar'),
    title_en: formData.get('title_en'),
    description_ar: formData.get('description_ar'),
    description_en: formData.get('description_en'),
    category_id: formData.get('category_id') || undefined,
    city: formData.get('city'),
    budget_min: formData.get('budget_min') || undefined,
    budget_max: formData.get('budget_max') || undefined,
    timeline_start: formData.get('timeline_start') || undefined,
    timeline_end: formData.get('timeline_end') || undefined,
    classification: formData.get('classification') || undefined,
    source: formData.get('source') || 'owner',
  };

  const parsed = UpdateProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: await toFieldErrors(parsed.error.issues) };
  }

  // Auto-translate missing bilingual fields
  const translated = await autoTranslateBilingualFields(parsed.data as Record<string, unknown>, ['title', 'description']);

  // Ownership + status check
  const { data: existing } = await db(supabase)
    .from('projects')
    .select('owner_id, status')
    .eq('id', parsed.data.project_id)
    .single();

  if (!existing) {
    return { data: null, error: t('projectNotFound') };
  }
  if (existing.owner_id !== user.id) {
    return { data: null, error: t('noPermissionEdit') };
  }
  if (!['draft', 'rejected'].includes(existing.status)) {
    return { data: null, error: t('cannotEditStatus') };
  }

  // Regenerate slugs
  const [slug_ar, slug_en] = await Promise.all([
    generateUniqueSlug((translated.title_ar as string) || parsed.data.title_ar || '', 'projects', 'slug_ar', db(supabase), parsed.data.project_id),
    generateUniqueSlug((translated.title_en as string) || parsed.data.title_en || '', 'projects', 'slug_en', db(supabase), parsed.data.project_id),
  ]);

  // Resolve city slug to UUID
  let cityId: string | null = null;
  if (parsed.data.city) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(parsed.data.city)) {
      cityId = parsed.data.city;
    } else {
      const { data: cityRow } = await (db(supabase) as { from: (t: string) => { select: (s: string) => { ilike: (col: string, val: string) => { single: () => Promise<{ data: { id: string } | null }> } } } }).from('saudi_cities').select('id').ilike('name_en', parsed.data.city).single();
      cityId = cityRow?.id ?? null;
    }
  }

  // Update
  const { error: updateErr } = await db(supabase)
    .from('projects')
    .update({
      title_ar: (translated.title_ar as string) || parsed.data.title_ar || '',
      title_en: (translated.title_en as string) || parsed.data.title_en || '',
      description_ar: (translated.description_ar as string) || parsed.data.description_ar || '',
      description_en: (translated.description_en as string) || parsed.data.description_en || '',
      category_id: parsed.data.category_id || null,
      city_id: cityId,
      budget_min: parsed.data.budget_min ?? null,
      budget_max: parsed.data.budget_max ?? null,
      timeline_start: parsed.data.timeline_start || null,
      timeline_end: parsed.data.timeline_end || null,
      classification: parsed.data.classification || null,
      source: parsed.data.source,
      slug_ar,
      slug_en,
      status: 'draft', // Reset to draft on edit
    })
    .eq('id', parsed.data.project_id);

  if (updateErr) {
    return { data: null, error: t('updateError') };
  }

  // Upload new files from FormData
  const projectFiles = formData.getAll('project_files') as File[];
  const fileCategory = (formData.get('file_category') as string) || 'general';
  if (projectFiles.length > 0) {
    const { uploadFile: doUpload } = await import('@/actions/uploads');
    for (const file of projectFiles) {
      if (!file || file.size === 0) continue;
      const uploadResult = await doUpload('project-files', file, `${parsed.data.project_id}/${fileCategory}-${Date.now()}`);
      if (uploadResult.data) {
        await db(supabase).from('project_files').insert({
          project_id: parsed.data.project_id,
          file_url: uploadResult.data.url,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          category: fileCategory,
        });
      }
    }
  }

  revalidatePath('/dashboard/projects');
  revalidatePath(`/dashboard/projects/${parsed.data.project_id}`);

  return { data: { id: parsed.data.project_id }, error: null };
}

// ---------------------------------------------------------------------------
// SUBMIT FOR APPROVAL
// ---------------------------------------------------------------------------
export async function submitProjectForApproval(
  projectId: string,
): Promise<ActionResult<{ status: string }>> {
  const t = await getTranslations('actions.projects');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: t('mustLogin') };
  }

  // Ownership + status check
  const { data: project } = await db(supabase)
    .from('projects')
    .select('owner_id, status')
    .eq('id', projectId)
    .single();

  if (!project) {
    return { data: null, error: t('projectNotFound') };
  }
  if (project.owner_id !== user.id) {
    return { data: null, error: t('noPermission') };
  }
  if (!['draft', 'rejected'].includes(project.status)) {
    return { data: null, error: t('cannotSubmitStatus') };
  }

  const { error: updateErr } = await db(supabase)
    .from('projects')
    .update({ status: 'pending' })
    .eq('id', projectId);

  if (updateErr) {
    return { data: null, error: t('submitError') };
  }

  // TODO: Notify admins

  revalidatePath('/dashboard/projects');
  return { data: { status: 'pending' }, error: null };
}

// ---------------------------------------------------------------------------
// DELETE PROJECT (draft only, no bids)
// ---------------------------------------------------------------------------
export async function deleteProject(
  projectId: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  const t = await getTranslations('actions.projects');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: t('mustLogin') };
  }

  const { data: project } = await db(supabase)
    .from('projects')
    .select('owner_id, status, bid_count')
    .eq('id', projectId)
    .single();

  if (!project) {
    return { data: null, error: t('projectNotFound') };
  }
  if (project.owner_id !== user.id) {
    return { data: null, error: t('noPermission') };
  }
  if (project.status !== 'draft') {
    return { data: null, error: t('cannotDeleteNonDraft') };
  }
  if (project.bid_count > 0) {
    return { data: null, error: t('cannotDeleteWithBids') };
  }

  // Delete project files from storage (if any)
  // TODO: Delete from project-files bucket when Supabase Storage is configured

  const { error: deleteErr } = await db(supabase)
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (deleteErr) {
    return { data: null, error: t('deleteError') };
  }

  revalidatePath('/dashboard/projects');
  return { data: { deleted: true }, error: null };
}

// ---------------------------------------------------------------------------
// REMOVE PROJECT FILE
// ---------------------------------------------------------------------------
export async function removeProjectFile(
  projectId: string,
  fileId: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  const t = await getTranslations('actions.projects');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Ownership check
  const { data: project } = await db(supabase)
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .single();
  if (!project) return { data: null, error: t('projectNotFound') };
  if (project.owner_id !== user.id) return { data: null, error: t('noPermission') };

  const { error: deleteErr } = await db(supabase)
    .from('project_files')
    .delete()
    .eq('id', fileId)
    .eq('project_id', projectId);

  if (deleteErr) return { data: null, error: t('deleteError') };

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { data: { deleted: true }, error: null };
}
