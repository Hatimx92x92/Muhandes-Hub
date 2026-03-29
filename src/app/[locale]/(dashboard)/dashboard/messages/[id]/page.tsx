// =============================================================================
// Muhandes HUB — Chat Thread Page
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { markAsRead } from '@/actions/messages';
import { ChatThread } from '@/components/features/messaging/chat-thread';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatThreadPage({ params }: PageProps) {
  const { id: conversationId } = await params;
  const t = await getTranslations('dashboard.messages');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify user is a participant
  const { data: participation } = await db(supabase)
    .from('conversation_participants')
    .select('id, unread_count')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .single();
  if (!participation) notFound();

  // Fetch conversation details
  const { data: conversation } = await db(supabase)
    .from('conversations')
    .select('id, project_id, product_id, deal_id, updated_at')
    .eq('id', conversationId)
    .single();
  if (!conversation) notFound();

  // Fetch other participant info
  const { data: otherParticipants } = await db(supabase)
    .from('conversation_participants')
    .select(`
      user_id,
      profiles:user_id (
        id,
        company_name_ar,
        company_name_en,
        full_name_ar,
        full_name_en,
        role
      )
    `)
    .eq('conversation_id', conversationId)
    .neq('user_id', user.id);

  const otherProfile = otherParticipants?.[0]?.profiles;
  const otherName = otherProfile?.company_name_ar || otherProfile?.full_name_ar || t('user');

  // Fetch messages (most recent first, then reverse for display)
  const { data: messagesRaw } = await db(supabase)
    .from('messages')
    .select('id, sender_id, content, file_url, file_name, file_size, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100);

  const messages = (messagesRaw ?? []).map((m: {
    id: string;
    sender_id: string;
    content: string;
    file_url: string | null;
    file_name: string | null;
    file_size: number | null;
    created_at: string;
  }) => ({
    id: m.id,
    senderId: m.sender_id,
    content: m.content,
    fileUrl: m.file_url,
    fileName: m.file_name,
    fileSize: m.file_size,
    createdAt: m.created_at,
    isMine: m.sender_id === user.id,
  }));

  // Fetch quick replies
  const { data: quickReplies } = await db(supabase)
    .from('quick_reply_templates')
    .select('id, content_ar, content_en')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  // Mark conversation as read
  if (participation.unread_count > 0) {
    await markAsRead(conversationId);
  }

  // Context info
  let contextLink = '';
  let contextHref = '';
  if (conversation.deal_id) {
    contextLink = t('viewDeal');
    contextHref = `/dashboard/deals/${conversation.deal_id}`;
  } else if (conversation.project_id) {
    contextLink = t('viewProject');
    contextHref = `/dashboard/projects/${conversation.project_id}`;
  } else if (conversation.product_id) {
    contextLink = t('viewProduct');
    contextHref = `/dashboard/products/${conversation.product_id}`;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <BreadcrumbOverride segment={conversationId} label={otherName} />
      {/* Thread Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-card rounded-t-xl">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
          {otherName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">{otherName}</h2>
          {otherProfile?.role && (
            <p className="text-xs text-muted-foreground">
              {t(`role.${otherProfile.role}`)}
            </p>
          )}
        </div>
        {contextLink && contextHref && (
          <Link
            href={contextHref}
            className="text-xs text-primary hover:underline shrink-0"
          >
            {contextLink}
          </Link>
        )}
      </div>

      {/* Chat Thread Client Component */}
      <ChatThread
        conversationId={conversationId}
        currentUserId={user.id}
        messages={messages}
        quickReplies={(quickReplies ?? []).map((qr: { id: string; content_ar: string; content_en: string }) => ({
          id: qr.id,
          contentAr: qr.content_ar,
          contentEn: qr.content_en,
        }))}
      />
    </div>
  );
}
