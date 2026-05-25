// =============================================================================
// Muhandes HUB — CRM Server Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import {
  CRMClientSchema,
  UpdateClientSchema,
  ClientNoteSchema,
  CRMTagSchema,
  ReminderSchema,
  DetectDuplicatesSchema,
  MergeClientsSchema,
} from '@/schemas/crm';
import type { ActionResult } from '@/types';
import { getEffectiveLimits } from '@/types';

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

const CRM_PATH = '/dashboard/crm';

// ---------------------------------------------------------------------------
// searchUsersForCRM — Search existing platform users for CRM contact creation
// ---------------------------------------------------------------------------
export interface CRMUserResult {
  id: string;
  full_name_ar: string | null;
  full_name_en: string | null;
  company_name_ar: string | null;
  company_name_en: string | null;
  phone: string | null;
  email: string | null;
}

export async function searchUsersForCRM(
  query: string,
): Promise<ActionResult<CRMUserResult[]>> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  if (!query || query.trim().length < 2) return { data: [], error: null };

  const q = `%${query.trim()}%`;

  // Fetch already-linked user IDs for this owner so we can exclude them
  const { data: existing } = await db(supabase)
    .from('crm_clients')
    .select('linked_user_id')
    .eq('owner_id', user.id)
    .not('linked_user_id', 'is', null);

  const excludedIds: string[] = (existing ?? [])
    .map((r: { linked_user_id: string | null }) => r.linked_user_id)
    .filter(Boolean);

  let queryBuilder = db(supabase)
    .from('profiles')
    .select('id, full_name_ar, full_name_en, company_name_ar, company_name_en, phone, email')
    .neq('id', user.id)
    .or(
      `full_name_ar.ilike.${q},full_name_en.ilike.${q},company_name_ar.ilike.${q},company_name_en.ilike.${q},email.ilike.${q}`,
    )
    .limit(10);

  if (excludedIds.length > 0) {
    queryBuilder = queryBuilder.not('id', 'in', `(${excludedIds.join(',')})`);
  }

  const { data, error } = await queryBuilder;
  if (error) return { data: null, error: t('searchError') };

  return { data: data ?? [], error: null };
}

// ---------------------------------------------------------------------------
// addClient — Add a new CRM client from an existing platform user
// ---------------------------------------------------------------------------
export async function addClient(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  let parsedTags: string[] = [];
  try {
    parsedTags = JSON.parse(formData.get('tags') as string || '[]');
  } catch {
    return { data: null, error: t('invalidData') };
  }

  const rawData = {
    linked_user_id: formData.get('linked_user_id') as string,
    source: formData.get('source') as string || 'manual_entry',
    pipeline_stage: formData.get('pipeline_stage') as string || 'lead',
    tags: parsedTags,
  };

  const parsed = CRMClientSchema.safeParse(rawData);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  // Role check — buyer cannot access CRM
  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role === 'buyer') {
    return { data: null, error: t('accessDenied') };
  }

  // Tier limit
  const { data: sub } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  const tier = (sub?.tier as string) || 'starter';
  const limits = getEffectiveLimits(profile.role, tier);
  if (limits && limits.crmClients !== Infinity) {
    const { count } = await db(supabase)
      .from('crm_clients')
      .select('id', { count: 'exact' })
      .eq('owner_id', user.id)
      .eq('is_archived', false);

    if ((count ?? 0) >= limits.crmClients) {
      return { data: null, error: t('clientLimitReached', { limit: limits.crmClients }) };
    }
  }

  // Duplicate check — same user already linked to this owner
  const { count: dupCount } = await db(supabase)
    .from('crm_clients')
    .select('id', { count: 'exact' })
    .eq('owner_id', user.id)
    .eq('linked_user_id', parsed.data.linked_user_id);

  if ((dupCount ?? 0) > 0) {
    return { data: null, error: t('clientAlreadyExists') };
  }

  // Fetch profile data to populate contact fields
  const { data: targetProfile, error: profileError } = await db(supabase)
    .from('profiles')
    .select('full_name_ar, full_name_en, company_name_ar, phone, email')
    .eq('id', parsed.data.linked_user_id)
    .single();

  if (profileError || !targetProfile) {
    return { data: null, error: t('userNotFound') };
  }

  const name = targetProfile.full_name_ar || targetProfile.full_name_en || '';
  const company = targetProfile.company_name_ar || undefined;

  const { tags, ...clientData } = parsed.data;

  const { data: client, error } = await db(supabase)
    .from('crm_clients')
    .insert({
      owner_id: user.id,
      name,
      phone: targetProfile.phone || undefined,
      email: targetProfile.email || undefined,
      company,
      ...clientData,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: t('addClientError') };

  // Link tags
  if (tags.length > 0) {
    await db(supabase)
      .from('crm_client_tags')
      .insert(tags.map((tagId: string) => ({
        client_id: client.id,
        tag_id: tagId,
      })));
  }

  revalidatePath(CRM_PATH);
  return { data: { id: client.id }, error: null };
}

// ---------------------------------------------------------------------------
// updateClient — Update client details
// ---------------------------------------------------------------------------
export async function updateClient(
  _prev: ActionResult<{ id: string }>,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const rawData = {
    client_id: formData.get('client_id') as string,
    pipeline_stage: formData.get('pipeline_stage') as string || undefined,
  };

  const parsed = UpdateClientSchema.safeParse(rawData);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const { client_id, ...updates } = parsed.data;

  const { error } = await db(supabase)
    .from('crm_clients')
    .update(updates)
    .eq('id', client_id)
    .eq('owner_id', user.id);

  if (error) return { data: null, error: t('updateClientError') };

  revalidatePath(CRM_PATH);
  return { data: { id: client_id }, error: null };
}

// ---------------------------------------------------------------------------
// moveClientPipeline — Drag-drop pipeline stage change
// ---------------------------------------------------------------------------
export async function moveClientPipeline(
  clientId: string,
  stage: string,
): Promise<ActionResult<{ stage: string }>> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const validStages = ['lead', 'in_negotiation', 'active_deal', 'completed', 'repeat'];
  if (!validStages.includes(stage)) return { data: null, error: t('invalidStage') };

  const { error } = await db(supabase)
    .from('crm_clients')
    .update({ pipeline_stage: stage, last_interaction_at: new Date().toISOString() })
    .eq('id', clientId)
    .eq('owner_id', user.id);

  if (error) return { data: null, error: t('moveClientError') };

  revalidatePath(CRM_PATH);
  return { data: { stage }, error: null };
}

// ---------------------------------------------------------------------------
// addClientNote — Timestamped note
// ---------------------------------------------------------------------------
export async function addClientNote(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const rawData = {
    client_id: formData.get('client_id') as string,
    content_ar: formData.get('content_ar') as string,
    content_en: formData.get('content_en') as string || undefined,
    linked_entity_type: formData.get('linked_entity_type') as string || undefined,
    linked_entity_id: formData.get('linked_entity_id') as string || undefined,
  };

  const parsed = ClientNoteSchema.safeParse(rawData);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  // Verify ownership
  const { data: client } = await db(supabase)
    .from('crm_clients')
    .select('id, owner_id')
    .eq('id', parsed.data.client_id)
    .eq('owner_id', user.id)
    .single();

  if (!client) return { data: null, error: t('clientNotFound') };

  const { data: note, error } = await db(supabase)
    .from('crm_client_notes')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) return { data: null, error: t('addNoteError') };

  // Update last interaction
  await db(supabase)
    .from('crm_clients')
    .update({ last_interaction_at: new Date().toISOString() })
    .eq('id', parsed.data.client_id);

  revalidatePath(CRM_PATH);
  return { data: { id: note.id }, error: null };
}

// ---------------------------------------------------------------------------
// togglePinNote — Pin/unpin a note
// ---------------------------------------------------------------------------
export async function togglePinNote(noteId: string, pinned: boolean): Promise<ActionResult> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Verify note ownership through client
  const { data: note } = await db(supabase)
    .from('crm_client_notes')
    .select('id, client_id, crm_clients!inner(owner_id)')
    .eq('id', noteId)
    .single();

  if (!note) return { data: null, error: t('noteNotFound') };

  const { error } = await db(supabase)
    .from('crm_client_notes')
    .update({ is_pinned: pinned })
    .eq('id', noteId);

  if (error) return { data: null, error: t('updateNoteError') };

  revalidatePath(CRM_PATH);
  return { data: undefined, error: null };
}

// ---------------------------------------------------------------------------
// createTag — Create a CRM tag
// ---------------------------------------------------------------------------
export async function createTag(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const rawData = {
    name: formData.get('name') as string,
    color: formData.get('color') as string || '#6366f1',
  };

  const parsed = CRMTagSchema.safeParse(rawData);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const { data: tag, error } = await db(supabase)
    .from('crm_tags')
    .insert({ owner_id: user.id, ...parsed.data })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') return { data: null, error: t('tagAlreadyExists') };
    return { data: null, error: t('createTagError') };
  }

  revalidatePath(CRM_PATH);
  return { data: { id: tag.id }, error: null };
}

// ---------------------------------------------------------------------------
// tagClient — Assign tags to a client
// ---------------------------------------------------------------------------
export async function tagClient(
  clientId: string,
  tagIds: string[],
): Promise<ActionResult<{ tagged: boolean }>> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Remove existing tags
  await db(supabase)
    .from('crm_client_tags')
    .delete()
    .eq('client_id', clientId);

  // Insert new tags
  if (tagIds.length > 0) {
    await db(supabase)
      .from('crm_client_tags')
      .insert(tagIds.map(tagId => ({
        client_id: clientId,
        tag_id: tagId,
      })));
  }

  revalidatePath(CRM_PATH);
  return { data: { tagged: true }, error: null };
}

// ---------------------------------------------------------------------------
// setReminder — Create a follow-up reminder
// ---------------------------------------------------------------------------
export async function setReminder(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const rawData = {
    client_id: formData.get('client_id') as string,
    reminder_date: formData.get('reminder_date') as string,
    note: formData.get('note') as string || undefined,
  };

  const parsed = ReminderSchema.safeParse(rawData);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const { data: reminder, error } = await db(supabase)
    .from('crm_follow_up_reminders')
    .insert({
      owner_id: user.id,
      ...parsed.data,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: t('createReminderError') };

  revalidatePath(CRM_PATH);
  return { data: { id: reminder.id }, error: null };
}

// ---------------------------------------------------------------------------
// completeReminder — Mark reminder as completed
// ---------------------------------------------------------------------------
export async function completeReminder(reminderId: string): Promise<ActionResult> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { error } = await db(supabase)
    .from('crm_follow_up_reminders')
    .update({ is_completed: true })
    .eq('id', reminderId)
    .eq('owner_id', user.id);

  if (error) return { data: null, error: t('updateReminderError') };

  revalidatePath(CRM_PATH);
  return { data: undefined, error: null };
}

// ---------------------------------------------------------------------------
// toggleFavorite — Star/unstar a client
// ---------------------------------------------------------------------------
export async function toggleFavorite(clientId: string, favorite: boolean): Promise<ActionResult> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { error } = await db(supabase)
    .from('crm_clients')
    .update({ is_favorite: favorite })
    .eq('id', clientId)
    .eq('owner_id', user.id);

  if (error) return { data: null, error: t('updateFavoriteError') };

  revalidatePath(CRM_PATH);
  return { data: undefined, error: null };
}

// ---------------------------------------------------------------------------
// archiveClient — Soft archive
// ---------------------------------------------------------------------------
export async function archiveClient(clientId: string, archive: boolean): Promise<ActionResult> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { error } = await db(supabase)
    .from('crm_clients')
    .update({ is_archived: archive })
    .eq('id', clientId)
    .eq('owner_id', user.id);

  if (error) return { data: null, error: t('operationError') };

  revalidatePath(CRM_PATH);
  return { data: undefined, error: null };
}

// ---------------------------------------------------------------------------
// autoLinkClient — Auto-add client from deal
// ---------------------------------------------------------------------------
export async function autoLinkClient(
  dealId: string,
): Promise<ActionResult<{ clientId: string }>> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { data: deal } = await db(supabase)
    .from('deals')
    .select('buyer_id, seller_id, trigger_source')
    .eq('id', dealId)
    .single();

  if (!deal) return { data: null, error: t('dealNotFound') };

  // The counterparty is the client
  const counterpartyId = deal.buyer_id === user.id ? deal.seller_id : deal.buyer_id;

  // Check if already exists
  const { data: existing } = await db(supabase)
    .from('crm_clients')
    .select('id')
    .eq('owner_id', user.id)
    .eq('linked_user_id', counterpartyId)
    .single();

  if (existing) return { data: { clientId: existing.id }, error: null };

  // Get counterparty profile
  const { data: counterparty } = await db(supabase)
    .from('profiles')
    .select('id, full_name_ar, full_name_en, phone, email, company_name_ar')
    .eq('id', counterpartyId)
    .single();

  if (!counterparty) return { data: null, error: t('counterpartyNotFound') };

  // Map trigger source to client source
  const sourceMap: Record<string, string> = {
    bid_award: 'bid_award',
    inquiry_quotation: 'product_inquiry',
    rfq_response: 'rfq_response',
    direct_hire: 'direct_hire',
  };

  const { data: client, error } = await db(supabase)
    .from('crm_clients')
    .insert({
      owner_id: user.id,
      linked_user_id: counterpartyId,
      name: counterparty.full_name_ar || counterparty.full_name_en || t('defaultClientName'),
      phone: counterparty.phone,
      email: counterparty.email,
      company: counterparty.company_name_ar,
      source: sourceMap[deal.trigger_source as string] || 'manual_entry',
      pipeline_stage: 'active_deal',
    })
    .select('id')
    .single();

  if (error) return { data: null, error: t('addClientError') };

  revalidatePath(CRM_PATH);
  return { data: { clientId: client.id }, error: null };
}

// ---------------------------------------------------------------------------
// calculateClientScore — A/B/C scoring (A≥80, B≥50, C<50)
// Factors: deal count, deal value, on-time completion, review avg, recency
// ---------------------------------------------------------------------------
export async function calculateClientScore(
  clientId: string,
): Promise<ActionResult<{ score: number; grade: 'A' | 'B' | 'C'; breakdown: Record<string, number> }>> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Verify ownership
  const { data: client } = await db(supabase)
    .from('crm_clients')
    .select('id, linked_user_id, last_interaction_at')
    .eq('id', clientId)
    .eq('owner_id', user.id)
    .single();

  if (!client) return { data: null, error: t('clientNotFound') };

  if (!client.linked_user_id) {
    // Manual clients without linked user can't be scored
    return { data: { score: 0, grade: 'C', breakdown: {} }, error: null };
  }

  const linkedUserId = client.linked_user_id;

  // 1. Deal count & completion rate (max 30 pts)
  const { data: deals } = await db(supabase)
    .from('deals')
    .select('id, status, value')
    .or(`buyer_id.eq.${linkedUserId},seller_id.eq.${linkedUserId}`);

  const totalDeals = deals?.length || 0;
  const completedDeals = (deals || []).filter((d: { status: string }) => d.status === 'completed').length;
  const completionRate = totalDeals > 0 ? completedDeals / totalDeals : 0;
  const dealCountScore = Math.min(15, totalDeals * 3); // 3pts per deal, max 15
  const completionScore = Math.round(completionRate * 15); // max 15

  // 2. Total deal value (max 20 pts)
  const totalValue = (deals || []).reduce(
    (sum: number, d: { value: number }) => sum + (Number(d.value) || 0),
    0,
  );
  // Normalize: 50k SAR = max score
  const valueScore = Math.min(20, Math.round((totalValue / 50000) * 20));

  // 3. Review average (max 25 pts)
  const { data: reviews } = await db(supabase)
    .from('reviews')
    .select('overall_rating')
    .eq('reviewee_id', linkedUserId);

  const avgRating = reviews?.length
    ? (reviews as { overall_rating: number }[]).reduce((s, r) => s + r.overall_rating, 0) / reviews.length
    : 3;
  const reviewScore = Math.round((avgRating / 5) * 25);

  // 4. Recency of last interaction (max 10 pts)
  const lastInteraction = client.last_interaction_at
    ? new Date(client.last_interaction_at)
    : new Date(0);
  const daysSinceInteraction = Math.floor(
    (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24),
  );
  const recencyScore = daysSinceInteraction <= 7 ? 10
    : daysSinceInteraction <= 30 ? 7
    : daysSinceInteraction <= 90 ? 4
    : 0;

  const totalScore = dealCountScore + completionScore + valueScore + reviewScore + recencyScore;
  const grade = totalScore >= 80 ? 'A' : totalScore >= 50 ? 'B' : 'C';

  // Update client score in DB
  await db(supabase)
    .from('crm_clients')
    .update({ score: totalScore, score_grade: grade })
    .eq('id', clientId);

  revalidatePath(CRM_PATH);
  return {
    data: {
      score: totalScore,
      grade,
      breakdown: {
        dealCount: dealCountScore,
        completion: completionScore,
        value: valueScore,
        reviews: reviewScore,
        recency: recencyScore,
      },
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// bulkTagClients — Bulk apply tag to multiple clients (Business+ only)
// ---------------------------------------------------------------------------
export async function bulkTagClients(
  _prev: ActionResult<{ count: number }> | null,
  formData: FormData,
): Promise<ActionResult<{ count: number }>> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Tier check — Business+ only
  const { data: sub } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  const tier = (sub?.tier as string) || 'starter';
  if (tier === 'starter' || tier === 'pro') {
    return { data: null, error: t('businessPlusOnly') };
  }

  let clientIds: string[];
  try {
    clientIds = JSON.parse(formData.get('client_ids') as string || '[]') as string[];
  } catch {
    return { data: null, error: t('invalidData') };
  }
  const tagId = formData.get('tag_id') as string;

  if (!clientIds.length || !tagId) {
    return { data: null, error: t('selectClientsAndTag') };
  }

  // Verify ownership of all clients
  const { data: clients } = await db(supabase)
    .from('crm_clients')
    .select('id')
    .eq('owner_id', user.id)
    .in('id', clientIds);

  const validIds = (clients || []).map((c: { id: string }) => c.id);

  // Insert tags (ignore duplicates)
  const rows = validIds.map((clientId: string) => ({
    client_id: clientId,
    tag_id: tagId,
  }));

  if (rows.length === 0) return { data: { count: 0 }, error: null };

  const { error } = await db(supabase)
    .from('crm_client_tags')
    .upsert(rows, { onConflict: 'client_id,tag_id' });

  if (error) return { data: null, error: t('bulkTagError') };

  revalidatePath(CRM_PATH);
  return { data: { count: rows.length }, error: null };
}

// ---------------------------------------------------------------------------
// bulkArchiveClients — Bulk archive clients (Business+ only)
// ---------------------------------------------------------------------------
export async function bulkArchiveClients(
  _prev: ActionResult<{ count: number }> | null,
  formData: FormData,
): Promise<ActionResult<{ count: number }>> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Tier check
  const { data: sub } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  const tier = (sub?.tier as string) || 'starter';
  if (tier === 'starter' || tier === 'pro') {
    return { data: null, error: t('businessPlusOnly') };
  }

  let clientIds: string[];
  try {
    clientIds = JSON.parse(formData.get('client_ids') as string || '[]') as string[];
  } catch {
    return { data: null, error: t('invalidData') };
  }
  if (!clientIds.length) return { data: { count: 0 }, error: null };

  const { error, count } = await db(supabase)
    .from('crm_clients')
    .update({ is_archived: true })
    .eq('owner_id', user.id)
    .in('id', clientIds);

  if (error) return { data: null, error: t('bulkArchiveError') };

  revalidatePath(CRM_PATH);
  return { data: { count: count ?? clientIds.length }, error: null };
}

// ---------------------------------------------------------------------------
// exportClientsCSV — Export CRM clients as CSV (Business+ only)
// ---------------------------------------------------------------------------
export async function exportClientsCSV(): Promise<ActionResult<{ csv: string }>> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Tier check
  const { data: sub } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  const tier = (sub?.tier as string) || 'starter';
  if (tier === 'starter' || tier === 'pro') {
    return { data: null, error: t('businessPlusOnly') };
  }

  const { data: clients } = await db(supabase)
    .from('crm_clients')
    .select('name, email, phone, company, city_id, pipeline_stage, score, score_grade, source, is_favorite, is_archived, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (!clients || clients.length === 0) {
    return { data: { csv: '' }, error: null };
  }

  // BOM for Arabic support in Excel
  const BOM = '\uFEFF';
  const headers = [t('csvHeaderName'), t('csvHeaderEmail'), t('csvHeaderPhone'), t('csvHeaderCompany'), t('csvHeaderCity'), t('csvHeaderStage'), t('csvHeaderScore'), t('csvHeaderGrade'), t('csvHeaderSource'), t('csvHeaderFavorite'), t('csvHeaderArchived'), t('csvHeaderCreatedAt')];
  const rows = (clients as Record<string, string | number | boolean | null>[]).map((c) => [
    c.name || '',
    c.email || '',
    c.phone || '',
    c.company || '',
    c.city_id || '',
    c.pipeline_stage || '',
    c.score || 0,
    c.score_grade || '',
    c.source || '',
    c.is_favorite ? t('yes') : t('no'),
    c.is_archived ? t('yes') : t('no'),
    c.created_at ? new Date(c.created_at as string).toLocaleDateString('ar-SA') : '',
  ]);

  const csv = BOM + [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');

  return { data: { csv }, error: null };
}

// ---------------------------------------------------------------------------
// getClientRevenue — Revenue analytics per client
// ---------------------------------------------------------------------------
export async function getClientRevenue(
  clientId: string,
): Promise<ActionResult<{
  totalRevenue: number;
  dealCount: number;
  averageDealValue: number;
  monthlyRevenue: { month: string; amount: number }[];
}>> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Verify ownership
  const { data: client } = await db(supabase)
    .from('crm_clients')
    .select('id, linked_user_id')
    .eq('id', clientId)
    .eq('owner_id', user.id)
    .single();

  if (!client) return { data: null, error: t('clientNotFound') };

  if (!client.linked_user_id) {
    return {
      data: { totalRevenue: 0, dealCount: 0, averageDealValue: 0, monthlyRevenue: [] },
      error: null,
    };
  }

  // Get deals with this client
  const { data: deals } = await db(supabase)
    .from('deals')
    .select('id, value, status, created_at')
    .or(`buyer_id.eq.${client.linked_user_id},seller_id.eq.${client.linked_user_id}`)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

  // Filter to deals involving both user AND client
  const relevantDeals = (deals || []).filter((d: { buyer_id?: string; seller_id?: string }) => {
    const involves = (id: string) => d.buyer_id === id || d.seller_id === id;
    return involves(user.id) && involves(client.linked_user_id);
  }) as { id: string; value: number; status: string; created_at: string }[];

  const totalRevenue = relevantDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const dealCount = relevantDeals.length;
  const averageDealValue = dealCount > 0 ? Math.round(totalRevenue / dealCount) : 0;

  // Monthly breakdown
  const monthMap = new Map<string, number>();
  for (const deal of relevantDeals) {
    const date = new Date(deal.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, (monthMap.get(key) || 0) + (Number(deal.value) || 0));
  }

  const monthlyRevenue = Array.from(monthMap.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Update client total in DB
  await db(supabase)
    .from('crm_clients')
    .update({ total_revenue: totalRevenue })
    .eq('id', clientId);

  return {
    data: { totalRevenue, dealCount, averageDealValue, monthlyRevenue },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// detectDuplicates — Find potential duplicate clients (Pro+ only)
// ---------------------------------------------------------------------------
export async function detectDuplicates(
  fields: { name?: string; email?: string; phone?: string; company?: string },
): Promise<ActionResult<{
  duplicates: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    pipeline_stage: string;
    matchReasons: string[];
  }>;
}>> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Validate input
  const parsed = DetectDuplicatesSchema.safeParse(fields);
  if (!parsed.success) return { data: null, error: t('invalidData') };

  // Tier check — Pro+ only
  const { data: sub } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  const tier = (sub?.tier as string) || 'starter';
  if (tier === 'starter') {
    return { data: null, error: t('proPlusOnly') };
  }

  const { name, email, phone, company } = parsed.data;

  // Build OR conditions for fuzzy matching
  const conditions: string[] = [];
  if (phone && phone.length >= 4) conditions.push(`phone.ilike.%${phone}%`);
  if (email && email.length >= 3) conditions.push(`email.ilike.%${email}%`);
  if (company && company.length >= 2) conditions.push(`company.ilike.%${company}%`);
  if (name && name.length >= 2) conditions.push(`name.ilike.%${name}%`);

  if (conditions.length === 0) {
    return { data: { duplicates: [] }, error: null };
  }

  const { data: matches } = await db(supabase)
    .from('crm_clients')
    .select('id, name, email, phone, company, pipeline_stage')
    .eq('owner_id', user.id)
    .eq('is_archived', false)
    .or(conditions.join(','))
    .limit(10);

  type ClientRow = { id: string; name: string; email: string | null; phone: string | null; company: string | null; pipeline_stage: string };
  const duplicates = ((matches ?? []) as ClientRow[]).map((c) => {
    const matchReasons: string[] = [];
    if (phone && c.phone && c.phone.includes(phone)) matchReasons.push('phone');
    if (email && c.email && c.email.toLowerCase() === email.toLowerCase()) matchReasons.push('email');
    if (company && c.company && c.company.toLowerCase().includes(company.toLowerCase())) matchReasons.push('company');
    if (name && c.name && c.name.toLowerCase().includes(name.toLowerCase())) matchReasons.push('name');
    return { ...c, matchReasons };
  }).filter((c) => c.matchReasons.length > 0);

  return { data: { duplicates }, error: null };
}

// ---------------------------------------------------------------------------
// mergeClients — Merge secondary client into primary (Pro+ only)
// ---------------------------------------------------------------------------
export async function mergeClients(
  primaryId: string,
  secondaryId: string,
): Promise<ActionResult<{ primaryId: string }>> {
  const t = await getTranslations('actions.crm');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Validate input
  const parsed = MergeClientsSchema.safeParse({ primary_id: primaryId, secondary_id: secondaryId });
  if (!parsed.success) return { data: null, error: t('invalidData') };

  if (primaryId === secondaryId) {
    return { data: null, error: t('cannotMergeSame') };
  }

  // Tier check — Pro+ only
  const { data: sub } = await db(supabase)
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  const tier = (sub?.tier as string) || 'starter';
  if (tier === 'starter') {
    return { data: null, error: t('proPlusOnly') };
  }

  // Verify ownership of both clients
  const { data: clients } = await db(supabase)
    .from('crm_clients')
    .select('id, name, email, phone, company, total_deal_value, total_deals, score, updated_at')
    .eq('owner_id', user.id)
    .in('id', [primaryId, secondaryId]);

  type MergeClientRow = {
    id: string; name: string; email: string | null; phone: string | null;
    company: string | null; total_deal_value: number; total_deals: number;
    score: number; updated_at: string;
  };
  const rows = (clients ?? []) as MergeClientRow[];
  if (rows.length !== 2) {
    return { data: null, error: t('clientNotFound') };
  }

  const primary = rows.find((c) => c.id === primaryId)!;
  const secondary = rows.find((c) => c.id === secondaryId)!;

  // Determine which fields are more recent
  const secondaryIsNewer = new Date(secondary.updated_at) > new Date(primary.updated_at);

  // Update primary with merged data
  const mergedValues = {
    email: primary.email || secondary.email || null,
    phone: primary.phone || secondary.phone || null,
    company: primary.company || secondary.company || null,
    total_deal_value: (Number(primary.total_deal_value) || 0) + (Number(secondary.total_deal_value) || 0),
    total_deals: (primary.total_deals || 0) + (secondary.total_deals || 0),
    score: Math.max(primary.score || 0, secondary.score || 0),
  };

  // If secondary is newer and has data the primary doesn't, prefer it
  if (secondaryIsNewer) {
    if (secondary.email && !primary.email) mergedValues.email = secondary.email;
    if (secondary.phone && !primary.phone) mergedValues.phone = secondary.phone;
    if (secondary.company && !primary.company) mergedValues.company = secondary.company;
  }

  await db(supabase)
    .from('crm_clients')
    .update(mergedValues)
    .eq('id', primaryId);

  // Transfer notes from secondary to primary
  await db(supabase)
    .from('crm_client_notes')
    .update({ client_id: primaryId })
    .eq('client_id', secondaryId);

  // Transfer reminders from secondary to primary
  await db(supabase)
    .from('crm_follow_up_reminders')
    .update({ client_id: primaryId })
    .eq('client_id', secondaryId);

  // Transfer tags (merge — add missing tags from secondary)
  const { data: secondaryTags } = await db(supabase)
    .from('crm_client_tags')
    .select('tag_id')
    .eq('client_id', secondaryId);

  if (secondaryTags && secondaryTags.length > 0) {
    const tagRows = (secondaryTags as { tag_id: string }[]).map((t) => ({
      client_id: primaryId,
      tag_id: t.tag_id,
    }));
    await db(supabase)
      .from('crm_client_tags')
      .upsert(tagRows, { onConflict: 'client_id,tag_id' });
  }

  // Delete secondary's tags (now transferred)
  await db(supabase)
    .from('crm_client_tags')
    .delete()
    .eq('client_id', secondaryId);

  // Add merge audit note to primary
  await db(supabase)
    .from('crm_client_notes')
    .insert({
      client_id: primaryId,
      author_id: user.id,
      content_ar: `تم دمج العميل "${secondary.name}" في هذا السجل`,
      content_en: `Client "${secondary.name}" merged into this record`,
    });

  // Archive secondary client
  await db(supabase)
    .from('crm_clients')
    .update({ is_archived: true })
    .eq('id', secondaryId);

  revalidatePath(CRM_PATH);
  return { data: { primaryId }, error: null };
}
