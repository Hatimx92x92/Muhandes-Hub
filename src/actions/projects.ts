// =============================================================================
// Muqawil HUB — Project Server Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { ProjectSchema, UpdateProjectSchema } from '@/schemas/project';
import type { ActionResult } from '@/types';

// Temporary helper: cast supabase for table queries until types are generated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: Awaited<ReturnType<typeof createClient>>): any {
  return supabase;
}

// ---------------------------------------------------------------------------
// Helper: parse Zod issues into fieldErrors
// ---------------------------------------------------------------------------
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
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  // 4. Insert project
  const { data: project, error: insertErr } = await db(supabase)
    .from('projects')
    .insert({
      owner_id: user.id,
      title_ar: parsed.data.title_ar,
      title_en: parsed.data.title_en,
      description_ar: parsed.data.description_ar,
      description_en: parsed.data.description_en,
      category_id: parsed.data.category_id || null,
      city: parsed.data.city,
      budget_min: parsed.data.budget_min ?? null,
      budget_max: parsed.data.budget_max ?? null,
      timeline_start: parsed.data.timeline_start || null,
      timeline_end: parsed.data.timeline_end || null,
      classification: parsed.data.classification || null,
      source: parsed.data.source,
      status: 'draft',
    })
    .select('id, status')
    .single();

  if (insertErr || !project) {
    return { data: null, error: t('createError') };
  }

  // 5. Revalidate
  revalidatePath('/dashboard/projects');

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
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

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

  // Update
  const { error: updateErr } = await db(supabase)
    .from('projects')
    .update({
      title_ar: parsed.data.title_ar,
      title_en: parsed.data.title_en,
      description_ar: parsed.data.description_ar,
      description_en: parsed.data.description_en,
      category_id: parsed.data.category_id || null,
      city: parsed.data.city,
      budget_min: parsed.data.budget_min ?? null,
      budget_max: parsed.data.budget_max ?? null,
      timeline_start: parsed.data.timeline_start || null,
      timeline_end: parsed.data.timeline_end || null,
      classification: parsed.data.classification || null,
      source: parsed.data.source,
      status: 'draft', // Reset to draft on edit
    })
    .eq('id', parsed.data.project_id);

  if (updateErr) {
    return { data: null, error: t('updateError') };
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
