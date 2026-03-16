// =============================================================================
// Muqawil HUB — Messages Page (Conversation List)
// =============================================================================

import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { MessageSquare } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function MessagesPage() {
  const t = await getTranslations('dashboard.messages');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch user's conversations with participants and last message
  const { data: participations } = await db(supabase)
    .from('conversation_participants')
    .select(`
      conversation_id,
      unread_count,
      last_read_at,
      conversations:conversation_id (
        id,
        project_id,
        product_id,
        deal_id,
        updated_at
      )
    `)
    .eq('user_id', user.id)
    .eq('is_visible', true)
    .order('conversations(updated_at)', { ascending: false });

  const conversations = participations ?? [];

  // For each conversation, fetch other participant and last message
  const enrichedConversations = await Promise.all(
    conversations.map(async (p: {
      conversation_id: string;
      unread_count: number;
      conversations: { id: string; project_id: string | null; product_id: string | null; deal_id: string | null; updated_at: string };
    }) => {
      // Get other participants
      const { data: otherParticipants } = await db(supabase)
        .from('conversation_participants')
        .select(`
          user_id,
          profiles:user_id (
            id,
            company_name_ar,
            company_name_en,
            full_name_ar,
            full_name_en
          )
        `)
        .eq('conversation_id', p.conversation_id)
        .neq('user_id', user.id);

      // Get last message
      const { data: lastMessage } = await db(supabase)
        .from('messages')
        .select('id, content, sender_id, created_at')
        .eq('conversation_id', p.conversation_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const other = otherParticipants?.[0]?.profiles;
      const otherName = other?.company_name_ar || other?.full_name_ar || t('user');

      return {
        id: p.conversation_id,
        otherName,
        otherUserId: otherParticipants?.[0]?.user_id,
        unreadCount: p.unread_count,
        lastMessage: lastMessage?.content ?? '',
        lastMessageTime: lastMessage?.created_at ?? p.conversations.updated_at,
        isLastMessageMine: lastMessage?.sender_id === user.id,
        context: p.conversations.project_id
          ? t('contextProject')
          : p.conversations.product_id
            ? t('contextProduct')
            : p.conversations.deal_id
              ? t('contextDeal')
              : null,
      };
    }),
  );

  // Sort by last message time
  enrichedConversations.sort((a, b) =>
    new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime(),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Conversation List */}
      {enrichedConversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-12 w-12" />}
          title={t('noMessages')}
          description={t('noMessagesDesc')}
        />
      ) : (
        <div className="space-y-2">
          {enrichedConversations.map((conv) => (
            <Link key={conv.id} href={`/dashboard/messages/${conv.id}`}>
              <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Avatar placeholder */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {conv.otherName.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate">
                          {conv.otherName}
                        </span>
                        {conv.context && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {conv.context}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {conv.isLastMessageMine && (
                          <span className="text-muted-foreground/70">{t('you')}: </span>
                        )}
                        {conv.lastMessage || t('noMessagesYet')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(conv.lastMessageTime)}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
