import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLocale } from 'next-intl/server';
import { markAsRead } from '@/actions/messages';
import { ChatThread } from '@/components/features/messaging/chat-thread';
import { BreadcrumbOverride } from '@/components/layout/breadcrumb-provider';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(client: any): any {
  return client;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminChatThreadPage({ params }: PageProps) {
  const { id: conversationId } = await params;
  const locale = await getLocale();
  const isAr = locale === 'ar';

  // Auth — must be admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db(supabase)
    .from('profiles')
    .select('is_admin, full_name')
    .eq('id', user.id)
    .single();
  if (!profile?.is_admin) redirect('/admin');

  const adminClient = createAdminClient();

  // Verify admin is a participant (or allow admin to view any conversation)
  const { data: participation } = await db(supabase)
    .from('conversation_participants')
    .select('id, unread_count')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .single();
  if (!participation) notFound();

  // Fetch other participant's profile via admin client (bypasses RLS)
  const { data: otherParticipants } = await db(adminClient)
    .from('conversation_participants')
    .select('user_id, profiles:user_id(id, full_name, company_name_ar, company_name_en, role)')
    .eq('conversation_id', conversationId)
    .neq('user_id', user.id);

  const otherProfile = otherParticipants?.[0]?.profiles;
  const otherName = isAr
    ? (otherProfile?.company_name_ar || otherProfile?.full_name || 'المستخدم')
    : (otherProfile?.company_name_en || otherProfile?.full_name || 'User');

  // Fetch messages via admin client
  const { data: messagesRaw } = await db(adminClient)
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

  // Fetch admin's quick replies
  const { data: quickReplies } = await db(supabase)
    .from('quick_reply_templates')
    .select('id, content_ar, content_en')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  // Mark as read
  if (participation.unread_count > 0) {
    await markAsRead(conversationId);
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
            <p className="text-xs text-muted-foreground">{otherProfile.role}</p>
          )}
        </div>
      </div>

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
      />
    </div>
  );
}
