// =============================================================================
// Muhandes HUB — Chat Thread Page
// =============================================================================

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';
import { ChatThread } from '@/components/features/messaging/chat-thread';
import { EntityContextBanner } from '@/components/features/messaging/entity-context-banner';
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
  const locale = await getLocale();
  const isAr = locale === 'ar';
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

  // Fetch conversation + all entity IDs
  const { data: conversation } = await db(supabase)
    .from('conversations')
    .select('id, project_id, product_id, deal_id, updated_at')
    .eq('id', conversationId)
    .single();
  if (!conversation) notFound();

  // Other participant info
  const { data: otherParticipants } = await db(supabase)
    .from('conversation_participants')
    .select(`
      user_id,
      profiles:user_id (
        id,
        full_name,
        company_name_ar,
        company_name_en,
        role
      )
    `)
    .eq('conversation_id', conversationId)
    .neq('user_id', user.id);

  const otherProfile = otherParticipants?.[0]?.profiles;
  const otherName = isAr
    ? (otherProfile?.company_name_ar || otherProfile?.full_name || t('user'))
    : (otherProfile?.company_name_en || otherProfile?.full_name || t('user'));

  // Fetch messages
  const { data: messagesRaw } = await db(supabase)
    .from('messages')
    .select('id, sender_id, content, file_url, file_name, file_size, attachments, created_at')
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(100);

  const messages = (messagesRaw ?? []).map((m: {
    id: string;
    sender_id: string;
    content: string;
    file_url: string | null;
    file_name: string | null;
    file_size: number | null;
    attachments: Array<{ url: string; name: string; size: number; mimeType: string }> | null;
    created_at: string;
  }) => ({
    id: m.id,
    senderId: m.sender_id,
    content: m.content,
    fileUrl: m.file_url,
    fileName: m.file_name,
    fileSize: m.file_size,
    attachments: m.attachments,
    createdAt: m.created_at,
    isMine: m.sender_id === user.id,
  }));

  // Fetch quick replies
  const { data: quickReplies } = await db(supabase)
    .from('quick_reply_templates')
    .select('id, content_ar, content_en')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  // Resolve entity context for banner
  type EntityContext =
    | { type: 'deal'; id: string; titleSlug: string; status: string; value: number }
    | { type: 'project'; id: string; title: string }
    | { type: 'product'; id: string; title: string }
    | null;

  let entityContext: EntityContext = null;

  if (conversation.deal_id) {
    const { data: deal } = await db(supabase)
      .from('deals')
      .select('id, status, value, title_slug')
      .eq('id', conversation.deal_id)
      .single();
    if (deal) {
      entityContext = {
        type: 'deal',
        id: deal.id,
        titleSlug: deal.title_slug ?? conversation.deal_id,
        status: deal.status,
        value: deal.value,
      };
    }
  } else if (conversation.project_id) {
    const { data: project } = await db(supabase)
      .from('projects')
      .select('id, title_ar, title_en')
      .eq('id', conversation.project_id)
      .single();
    if (project) {
      entityContext = {
        type: 'project',
        id: project.id,
        title: isAr ? (project.title_ar || project.title_en) : (project.title_en || project.title_ar),
      };
    }
  } else if (conversation.product_id) {
    const { data: product } = await db(supabase)
      .from('products')
      .select('id, title_ar, title_en')
      .eq('id', conversation.product_id)
      .single();
    if (product) {
      entityContext = {
        type: 'product',
        id: product.id,
        title: isAr ? (product.title_ar || product.title_en) : (product.title_en || product.title_ar),
      };
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <BreadcrumbOverride segment={conversationId} label={otherName} />

      {/* Participant Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-card rounded-t-xl">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
          {otherName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">{otherName}</h2>
          {otherProfile?.role && (
            <p className="text-xs text-muted-foreground">
              {t(`role.${otherProfile.role}`)}
            </p>
          )}
        </div>
      </div>

      {/* Entity Context Banner */}
      {entityContext && (
        <EntityContextBanner
          entity={entityContext as Parameters<typeof EntityContextBanner>[0]['entity']}
          locale={locale}
        />
      )}

      {/* Chat Thread */}
      <ChatThread
        conversationId={conversationId}
        currentUserId={user.id}
        messages={messages}
        quickReplies={(quickReplies ?? []).map((qr: { id: string; content_ar: string; content_en: string }) => ({
          id: qr.id,
          contentAr: qr.content_ar,
          contentEn: qr.content_en,
        }))}
        locale={locale}
        initialUnreadCount={participation.unread_count}
      />
    </div>
  );
}
