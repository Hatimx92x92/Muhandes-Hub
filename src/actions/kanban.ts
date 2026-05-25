// =============================================================================
// Muhandes HUB — Kanban & Daily Site Log Server Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import {
  KanbanColumnSchema,
  KanbanCardSchema,
  MoveCardSchema,
  DailyLogSchema,
} from '@/schemas/crm';
import type { ActionResult } from '@/types';
import { uploadFile } from '@/actions/uploads';

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

/** Verify user is a contractor on this deal */
async function verifyContractor(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  dealId: string,
  userId: string,
): Promise<{ error?: string }> {
  const t = await getTranslations('actions.kanban');
  const { data: deal } = await db(supabase)
    .from('deals')
    .select('seller_id, buyer_id')
    .eq('id', dealId)
    .single();

  if (!deal) return { error: t('dealNotFound') };
  if (deal.seller_id !== userId && deal.buyer_id !== userId) {
    return { error: t('unauthorized') };
  }
  return {};
}

// ---------------------------------------------------------------------------
// createKanbanColumn
// ---------------------------------------------------------------------------
export async function createKanbanColumn(
  _prev: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.kanban');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const rawData = {
    deal_id: formData.get('deal_id') as string,
    name: formData.get('name') as string,
    sort_order: formData.get('sort_order') as string,
  };

  const parsed = KanbanColumnSchema.safeParse(rawData);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const check = await verifyContractor(supabase, parsed.data.deal_id, user.id);
  if (check.error) return { data: null, error: check.error };

  const { data: column, error } = await db(supabase)
    .from('kanban_columns')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) return { data: null, error: t('createColumnError') };

  revalidatePath(`/dashboard/deals/${parsed.data.deal_id}/kanban`);
  return { data: { id: column.id }, error: null };
}

// ---------------------------------------------------------------------------
// createKanbanCard
// ---------------------------------------------------------------------------
export async function createKanbanCard(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.kanban');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const rawData = {
    column_id: formData.get('column_id') as string,
    deal_id: formData.get('deal_id') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string || undefined,
    assignee_name: formData.get('assignee_name') as string || undefined,
    due_date: formData.get('due_date') as string || undefined,
    priority: formData.get('priority') as string || 'medium',
  };

  const parsed = KanbanCardSchema.safeParse(rawData);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const check = await verifyContractor(supabase, parsed.data.deal_id, user.id);
  if (check.error) return { data: null, error: check.error };

  // Handle file uploads
  const files = formData.getAll('files') as File[];
  const fileUrls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    if (files[i].size === 0) continue;
    const result = await uploadFile(
      'deal-documents',
      files[i],
      `kanban/${parsed.data.deal_id}/${Date.now()}-${i}`,
    );
    if (result.data) fileUrls.push(result.data.url);
  }

  // Auto sort_order
  const { count } = await db(supabase)
    .from('kanban_cards')
    .select('id', { count: 'exact' })
    .eq('column_id', parsed.data.column_id);

  const { data: card, error } = await db(supabase)
    .from('kanban_cards')
    .insert({
      ...parsed.data,
      sort_order: count ?? 0,
      ...(fileUrls.length > 0 && { file_urls: fileUrls }),
    })
    .select('id')
    .single();

  if (error) return { data: null, error: t('createCardError') };

  revalidatePath(`/dashboard/deals/${parsed.data.deal_id}/kanban`);
  return { data: { id: card.id }, error: null };
}

// ---------------------------------------------------------------------------
// moveKanbanCard — Move card to different column/position
// ---------------------------------------------------------------------------
export async function moveKanbanCard(
  _prev: ActionResult<{ moved: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ moved: boolean }>> {
  const t = await getTranslations('actions.kanban');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const cardId = formData.get('card_id') as string;
  const targetColumnId = formData.get('target_column_id') as string;
  const position = Number(formData.get('position') || 0);
  const dealId = formData.get('deal_id') as string;

  const parsed = MoveCardSchema.safeParse({ card_id: cardId, target_column_id: targetColumnId, position });
  if (!parsed.success) return { data: null, error: t('invalidData') };

  if (dealId) {
    const check = await verifyContractor(supabase, dealId, user.id);
    if (check.error) return { data: null, error: check.error };
  }

  const { error } = await db(supabase)
    .from('kanban_cards')
    .update({
      column_id: targetColumnId,
      sort_order: position,
    })
    .eq('id', cardId);

  if (error) return { data: null, error: t('moveCardError') };

  revalidatePath('/dashboard/deals');
  return { data: { moved: true }, error: null };
}

export async function deleteKanbanCard(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const t = await getTranslations('actions.kanban');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const cardId = formData.get('card_id') as string;
  const dealId = formData.get('deal_id') as string;

  const { error } = await db(supabase)
    .from('kanban_cards')
    .delete()
    .eq('id', cardId);

  if (error) return { data: null, error: t('deleteCardError') };

  revalidatePath(`/dashboard/deals/${dealId}/kanban`);
  return { data: undefined, error: null };
}

// ---------------------------------------------------------------------------
// initializeKanban — Create default columns for a deal
// ---------------------------------------------------------------------------
export async function initializeKanban(
  _prev: ActionResult<{ initialized: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ initialized: boolean }>> {
  const t = await getTranslations('actions.kanban');
  const dealId = formData.get('deal_id') as string;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const check = await verifyContractor(supabase, dealId, user.id);
  if (check.error) return { data: null, error: check.error };

  // Check if columns already exist
  const { count } = await db(supabase)
    .from('kanban_columns')
    .select('id', { count: 'exact' })
    .eq('deal_id', dealId);

  if ((count ?? 0) > 0) return { data: { initialized: true }, error: null };

  const defaultColumns = [
    { deal_id: dealId, name: t('defaultColumnTodo'), sort_order: 0 },
    { deal_id: dealId, name: t('defaultColumnInProgress'), sort_order: 1 },
    { deal_id: dealId, name: t('defaultColumnReview'), sort_order: 2 },
    { deal_id: dealId, name: t('defaultColumnDone'), sort_order: 3 },
  ];

  const { error } = await db(supabase)
    .from('kanban_columns')
    .insert(defaultColumns);

  if (error) return { data: null, error: t('initBoardError') };

  revalidatePath(`/dashboard/deals/${dealId}/kanban`);
  return { data: { initialized: true }, error: null };
}

// ---------------------------------------------------------------------------
// createDailyLog — One per day per deal
// ---------------------------------------------------------------------------
export async function createDailyLog(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.kanban');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const rawData = {
    deal_id: formData.get('deal_id') as string,
    log_date: formData.get('log_date') as string,
    weather: formData.get('weather') as string || undefined,
    workers_on_site: formData.get('workers_on_site') as string,
    description_ar: formData.get('description_ar') as string,
    description_en: formData.get('description_en') as string || undefined,
    issues: formData.get('issues') as string || undefined,
    safety_notes: formData.get('safety_notes') as string || undefined,
  };

  const parsed = DailyLogSchema.safeParse(rawData);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const check = await verifyContractor(supabase, parsed.data.deal_id, user.id);
  if (check.error) return { data: null, error: check.error };

  // Handle photo uploads
  const photos = formData.getAll('photos') as File[];
  const photoUrls: string[] = [];
  for (let i = 0; i < photos.length; i++) {
    if (photos[i].size === 0) continue;
    const result = await uploadFile(
      'site-log-photos',
      photos[i],
      `${parsed.data.deal_id}/${parsed.data.log_date}-${Date.now()}-${i}`,
    );
    if (result.data) photoUrls.push(result.data.url);
  }

  const { data: log, error } = await db(supabase)
    .from('daily_site_logs')
    .insert({
      ...parsed.data,
      author_id: user.id,
      ...(photoUrls.length > 0 && { photo_urls: photoUrls }),
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') return { data: null, error: t('dailyLogDuplicate') };
    return { data: null, error: t('createLogError') };
  }

  revalidatePath(`/dashboard/deals/${parsed.data.deal_id}`);
  return { data: { id: log.id }, error: null };
}
