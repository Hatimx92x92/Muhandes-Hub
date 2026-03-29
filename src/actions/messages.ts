// =============================================================================
// Muhandes HUB — Message Server Actions
// =============================================================================

'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import {
  MessageSchema,
  CreateConversationSchema,
  QuickReplySchema,
} from '@/schemas/message';
import { uploadFile } from '@/actions/uploads';
import { messageLimiter, checkRateLimit } from '@/lib/rate-limit';
import type { ActionResult } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: Awaited<ReturnType<typeof createClient>>): any {
  return supabase;
}

// ---------------------------------------------------------------------------
// Helper: convert Zod errors to field errors
// ---------------------------------------------------------------------------
function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? 'form');
    fieldErrors[key] = fieldErrors[key] ?? [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

// ---------------------------------------------------------------------------
// SEND MESSAGE
// ---------------------------------------------------------------------------
export async function sendMessage(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.messages');
  // 1. Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // 1b. Rate limit
  const rl = messageLimiter();
  const { success: rlOk } = await checkRateLimit(rl, user.id);
  if (!rlOk) return { data: null, error: t('tooManyRequests') };

  // 2. Validate
  const raw = {
    conversation_id: formData.get('conversation_id'),
    content: formData.get('content') || '',
  };
  const parsed = MessageSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const { conversation_id, content } = parsed.data;

  // 2b. Handle file attachment upload
  let fileUrl: string | null = null;
  let fileName: string | null = null;
  let fileSize: number | null = null;

  const file = formData.get('file') as File | null;
  if (file && file.size > 0) {
    const uploadResult = await uploadFile(
      'message-attachments',
      file,
      `${conversation_id}/${Date.now()}`,
    );
    if (uploadResult.error) {
      return { data: null, error: uploadResult.error };
    }
    fileUrl = uploadResult.data!.url;
    fileName = file.name;
    fileSize = file.size;
  }

  // Must have content or file
  if (!content && !fileUrl) {
    return { data: null, error: t('invalidData') };
  }

  // 3. Verify user is a participant
  const { data: participant } = await db(supabase)
    .from('conversation_participants')
    .select('id')
    .eq('conversation_id', conversation_id)
    .eq('user_id', user.id)
    .single();
  if (!participant) return { data: null, error: t('notParticipant') };

  // 4. Insert message
  const { data: message, error: insertErr } = await db(supabase)
    .from('messages')
    .insert({
      conversation_id,
      sender_id: user.id,
      content: content || '',
      ...(fileUrl && { file_url: fileUrl }),
      ...(fileName && { file_name: fileName }),
      ...(fileSize && { file_size: fileSize }),
    })
    .select('id')
    .single();
  if (insertErr) return { data: null, error: t('sendError') };

  // 5. Update conversation updated_at
  await db(supabase)
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversation_id);

  // 6. Increment unread count for other participants
  await db(supabase).rpc('increment_unread_count', {
    p_conversation_id: conversation_id,
    p_sender_id: user.id,
  });

  revalidatePath('/dashboard/messages');
  revalidatePath(`/dashboard/messages/${conversation_id}`);

  return { data: { id: message.id }, error: null };
}

// ---------------------------------------------------------------------------
// CREATE CONVERSATION
// ---------------------------------------------------------------------------
export async function createConversation(
  _prev: ActionResult<{ conversationId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ conversationId: string }>> {
  const t = await getTranslations('actions.messages');
  // 1. Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // 2. Validate
  const raw = {
    participant_id: formData.get('participant_id'),
    context_type: formData.get('context_type') || undefined,
    context_id: formData.get('context_id') || undefined,
    initial_message: formData.get('initial_message'),
  };
  const parsed = CreateConversationSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const { participant_id, context_type, context_id, initial_message } = parsed.data;

  // 3. Can't create conversation with yourself
  if (participant_id === user.id) {
    return { data: null, error: t('cannotMessageSelf') };
  }

  // 4. Check for existing conversation between these two users
  const { data: existingConvs } = await db(supabase)
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id);

  if (existingConvs && existingConvs.length > 0) {
    const myConvIds = existingConvs.map((c: { conversation_id: string }) => c.conversation_id);
    const { data: existing } = await db(supabase)
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', participant_id)
      .in('conversation_id', myConvIds);

    if (existing && existing.length > 0) {
      // Conversation already exists — send message there
      const existingConvId = existing[0].conversation_id;
      const fd = new FormData();
      fd.set('conversation_id', existingConvId);
      fd.set('content', initial_message);
      await sendMessage(null, fd);
      revalidatePath('/dashboard/messages');
      return { data: { conversationId: existingConvId }, error: null };
    }
  }

  // 5. Build context columns
  const contextColumns: Record<string, string | null> = {
    project_id: null,
    product_id: null,
    deal_id: null,
  };
  if (context_type && context_id) {
    contextColumns[`${context_type}_id`] = context_id;
  }

  // 6. Create conversation
  const { data: conversation, error: convErr } = await db(supabase)
    .from('conversations')
    .insert(contextColumns)
    .select('id')
    .single();
  if (convErr) return { data: null, error: t('createConversationError') };

  // 7. Add participants
  await db(supabase)
    .from('conversation_participants')
    .insert([
      { conversation_id: conversation.id, user_id: user.id },
      { conversation_id: conversation.id, user_id: participant_id },
    ]);

  // 8. Send initial message
  const { error: msgErr } = await db(supabase)
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content: initial_message,
    });
  if (msgErr) return { data: null, error: t('sendFirstMessageError') };

  // 9. Increment unread for the other participant
  await db(supabase)
    .from('conversation_participants')
    .update({ unread_count: 1 })
    .eq('conversation_id', conversation.id)
    .eq('user_id', participant_id);

  revalidatePath('/dashboard/messages');

  return { data: { conversationId: conversation.id }, error: null };
}

// ---------------------------------------------------------------------------
// MARK AS READ
// ---------------------------------------------------------------------------
export async function markAsRead(
  conversationId: string,
): Promise<ActionResult<{ read: boolean }>> {
  const t = await getTranslations('actions.messages');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { error } = await db(supabase)
    .from('conversation_participants')
    .update({
      unread_count: 0,
      last_read_at: new Date().toISOString(),
    })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id);

  if (error) return { data: null, error: t('markReadError') };

  revalidatePath('/dashboard/messages');
  return { data: { read: true }, error: null };
}

// ---------------------------------------------------------------------------
// DELETE MESSAGE (soft delete — hidden for sender only)
// ---------------------------------------------------------------------------
export async function deleteMessage(
  messageId: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  const t = await getTranslations('actions.messages');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Verify sender
  const { data: message } = await db(supabase)
    .from('messages')
    .select('sender_id')
    .eq('id', messageId)
    .single();
  if (!message) return { data: null, error: t('messageNotFound') };
  if (message.sender_id !== user.id) return { data: null, error: t('cannotDeleteOthersMessage') };

  // Soft delete
  const { error } = await db(supabase)
    .from('messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId);

  if (error) return { data: null, error: t('deleteError') };

  revalidatePath('/dashboard/messages');
  return { data: { deleted: true }, error: null };
}

// ---------------------------------------------------------------------------
// SAVE QUICK REPLY
// ---------------------------------------------------------------------------
export async function saveQuickReply(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations('actions.messages');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const raw = {
    content_ar: formData.get('content_ar'),
    content_en: formData.get('content_en'),
  };
  const parsed = QuickReplySchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: t('invalidData'), fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const { data: reply, error } = await db(supabase)
    .from('quick_reply_templates')
    .insert({
      user_id: user.id,
      content_ar: parsed.data.content_ar,
      content_en: parsed.data.content_en,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: t('saveQuickReplyError') };

  revalidatePath('/dashboard/messages');
  return { data: { id: reply.id }, error: null };
}

// ---------------------------------------------------------------------------
// DELETE QUICK REPLY
// ---------------------------------------------------------------------------
export async function deleteQuickReply(
  replyId: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  const t = await getTranslations('actions.messages');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  const { error } = await db(supabase)
    .from('quick_reply_templates')
    .delete()
    .eq('id', replyId)
    .eq('user_id', user.id);

  if (error) return { data: null, error: t('deleteQuickReplyError') };

  revalidatePath('/dashboard/messages');
  return { data: { deleted: true }, error: null };
}

// ---------------------------------------------------------------------------
// GET OR CREATE DEAL CONVERSATION
// ---------------------------------------------------------------------------
interface DealConversationResult {
  conversationId: string;
  messages: Array<{
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    deleted_at: string | null;
    file_url?: string | null;
    file_name?: string | null;
  }>;
}

export async function getOrCreateDealConversation(
  dealId: string,
): Promise<ActionResult<DealConversationResult>> {
  const t = await getTranslations('actions.messages');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: t('mustLogin') };

  // Verify user is a deal participant
  const { data: deal } = await db(supabase)
    .from('deals')
    .select('id, buyer_id, seller_id')
    .eq('id', dealId)
    .single();

  if (!deal) return { data: null, error: t('dealNotFound') };
  if (deal.buyer_id !== user.id && deal.seller_id !== user.id) {
    return { data: null, error: t('notParticipant') };
  }

  const counterpartyId = deal.buyer_id === user.id ? deal.seller_id : deal.buyer_id;

  // Check for existing conversation with this deal_id
  const { data: existing } = await db(supabase)
    .from('conversations')
    .select('id')
    .eq('deal_id', dealId)
    .limit(1)
    .single();

  if (existing) {
    // Fetch messages
    const { data: messages } = await db(supabase)
      .from('messages')
      .select('id, conversation_id, sender_id, content, created_at, deleted_at, file_url, file_name')
      .eq('conversation_id', existing.id)
      .order('created_at', { ascending: true })
      .limit(200);

    // Mark as read
    await db(supabase)
      .from('conversation_participants')
      .update({ unread_count: 0, last_read_at: new Date().toISOString() })
      .eq('conversation_id', existing.id)
      .eq('user_id', user.id);

    return { data: { conversationId: existing.id, messages: messages || [] }, error: null };
  }

  // Create new conversation for this deal
  const { data: conversation, error: convErr } = await db(supabase)
    .from('conversations')
    .insert({ deal_id: dealId })
    .select('id')
    .single();

  if (convErr || !conversation) {
    return { data: null, error: t('createConversationError') };
  }

  // Add both participants
  await db(supabase)
    .from('conversation_participants')
    .insert([
      { conversation_id: conversation.id, user_id: user.id },
      { conversation_id: conversation.id, user_id: counterpartyId },
    ]);

  return { data: { conversationId: conversation.id, messages: [] }, error: null };
}
