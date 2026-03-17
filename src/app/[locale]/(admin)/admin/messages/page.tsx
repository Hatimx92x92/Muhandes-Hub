import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { MessageSquare } from 'lucide-react';
import { EmptyState } from '@/components/features/empty-state';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

export default async function AdminMessagesPage() {
  const t = await getTranslations('admin.messagesPage');
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch conversations the admin is part of
  const { data: conversations } = await db(supabase)
    .from('conversations')
    .select(`
      id,
      created_at,
      updated_at,
      conversation_participants!inner(user_id, unread_count),
      messages(id, content, sender_id, created_at)
    `)
    .order('updated_at', { ascending: false })
    .limit(50);

  const items = (conversations ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-12 w-12" />}
          title={t('noConversations')}
          description={t('noConversationsDesc')}
        />
      ) : (
        <div className="space-y-3">
          {items.map((conv) => {
            const messages = (conv.messages ?? []) as Record<string, unknown>[];
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
            const participants = (conv.conversation_participants ?? []) as Record<string, unknown>[];
            const unreadCount = participants.reduce((sum, p) => sum + Number(p.unread_count ?? 0), 0);

            return (
              <Link key={conv.id as string} href={`/admin/messages/${conv.id as string}`}>
                <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20 cursor-pointer">
                  <CardContent className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          #{(conv.id as string).slice(0, 8)}
                        </CardTitle>
                        {unreadCount > 0 && (
                          <Badge variant="info">
                            {t('unreadCount', { count: unreadCount })}
                          </Badge>
                        )}
                      </div>
                      {lastMessage && (
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {lastMessage.content as string}
                        </p>
                      )}
                    </div>
                    <time className="shrink-0 text-xs text-muted-foreground">
                      {new Date(conv.updated_at as string).toLocaleDateString(locale)}
                    </time>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
