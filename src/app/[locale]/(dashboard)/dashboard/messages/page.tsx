// =============================================================================
// Muhandes HUB — Messages Page (Conversation List)
// =============================================================================

import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations, getLocale } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { MessageSquare, Handshake, FolderOpen, Package } from 'lucide-react';
import { formatRelativeTime, formatSAR, cn } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

const DEAL_STATUS_STYLES: Record<string, { labelAr: string; labelEn: string; dot: string }> = {
  active:      { labelAr: 'نشطة',         labelEn: 'Active',      dot: 'bg-blue-500' },
  in_progress: { labelAr: 'قيد التنفيذ',   labelEn: 'In Progress', dot: 'bg-amber-500' },
  completed:   { labelAr: 'مكتملة',        labelEn: 'Completed',   dot: 'bg-green-500' },
  cancelled:   { labelAr: 'ملغاة',          labelEn: 'Cancelled',   dot: 'bg-muted-foreground' },
  disputed:    { labelAr: 'متنازع عليها',  labelEn: 'Disputed',    dot: 'bg-red-500' },
};

export default async function MessagesPage() {
  const t = await getTranslations('dashboard.messages');
  const locale = await getLocale();
  const isAr = locale === 'ar';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch user's conversations with participants
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

  // Enrich each conversation with participant info, last message, and entity details
  const enriched = await Promise.all(
    conversations.map(async (p: {
      conversation_id: string;
      unread_count: number;
      conversations: {
        id: string;
        project_id: string | null;
        product_id: string | null;
        deal_id: string | null;
        updated_at: string;
      };
    }) => {
      const conv = p.conversations;

      // Other participant
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
        .eq('conversation_id', p.conversation_id)
        .neq('user_id', user.id);

      // Last message
      const { data: lastMsg } = await db(supabase)
        .from('messages')
        .select('id, content, sender_id, created_at, file_name, attachments')
        .eq('conversation_id', p.conversation_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Entity details
      let entityInfo: {
        type: 'deal' | 'project' | 'product';
        id: string;
        label: string;
        subLabel?: string;
        status?: string;
        dealValue?: number;
      } | null = null;

      if (conv.deal_id) {
        const { data: deal } = await db(supabase)
          .from('deals')
          .select('id, status, value, title_slug')
          .eq('id', conv.deal_id)
          .single();
        if (deal) {
          entityInfo = {
            type: 'deal',
            id: deal.id,
            label: deal.title_slug ?? t('contextDeal'),
            status: deal.status,
            dealValue: deal.value,
          };
        }
      } else if (conv.project_id) {
        const { data: project } = await db(supabase)
          .from('projects')
          .select('id, title_ar, title_en')
          .eq('id', conv.project_id)
          .single();
        if (project) {
          entityInfo = {
            type: 'project',
            id: project.id,
            label: isAr ? (project.title_ar || project.title_en) : (project.title_en || project.title_ar),
          };
        }
      } else if (conv.product_id) {
        const { data: product } = await db(supabase)
          .from('products')
          .select('id, title_ar, title_en')
          .eq('id', conv.product_id)
          .single();
        if (product) {
          entityInfo = {
            type: 'product',
            id: product.id,
            label: isAr ? (product.title_ar || product.title_en) : (product.title_en || product.title_ar),
          };
        }
      }

      const other = otherParticipants?.[0]?.profiles;
      const otherName = isAr
        ? (other?.company_name_ar || other?.full_name || t('user'))
        : (other?.company_name_en || other?.full_name || t('user'));

      // Build last message preview
      let lastMsgPreview = '';
      if (lastMsg) {
        if (lastMsg.content) {
          lastMsgPreview = lastMsg.content;
        } else if (lastMsg.file_name) {
          lastMsgPreview = `📎 ${lastMsg.file_name}`;
        } else if (Array.isArray(lastMsg.attachments) && lastMsg.attachments.length > 0) {
          lastMsgPreview = `📎 ${lastMsg.attachments[0].name}`;
        }
      }

      return {
        id: p.conversation_id,
        otherName,
        otherInitial: otherName.charAt(0).toUpperCase(),
        unreadCount: p.unread_count,
        lastMessage: lastMsgPreview,
        lastMessageTime: lastMsg?.created_at ?? conv.updated_at,
        isLastMessageMine: lastMsg?.sender_id === user.id,
        entityInfo,
      };
    }),
  );

  // Sort by last message time descending
  enriched.sort((a, b) =>
    new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime(),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Conversation List */}
      {enriched.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-12 w-12" />}
          title={t('noMessages')}
          description={t('noMessagesDesc')}
        />
      ) : (
        <div className="space-y-2">
          {enriched.map((conv) => (
            <Link key={conv.id} href={`/dashboard/messages/${conv.id}`}>
              <Card
                className={cn(
                  'p-4 hover:bg-muted/50 transition-colors cursor-pointer',
                  conv.unreadCount > 0 && 'border-primary/30 bg-primary/2',
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {conv.otherInitial}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Name + entity badges row */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <span className={cn('font-semibold text-foreground truncate', conv.unreadCount > 0 && 'font-bold')}>
                        {conv.otherName}
                      </span>

                      {conv.entityInfo && (
                        <EntityBadge entity={conv.entityInfo} isAr={isAr} />
                      )}
                    </div>

                    {/* Last message preview */}
                    <p className={cn('text-sm text-muted-foreground truncate', conv.unreadCount > 0 && 'text-foreground font-medium')}>
                      {conv.isLastMessageMine && (
                        <span className="text-muted-foreground/70">{t('you')}: </span>
                      )}
                      {conv.lastMessage || t('noMessagesYet')}
                    </p>
                  </div>

                  {/* Time + unread count */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(conv.lastMessageTime)}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
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

// ---------------------------------------------------------------------------
// Entity Badge sub-component
// ---------------------------------------------------------------------------

function EntityBadge({
  entity,
  isAr,
}: {
  entity: { type: 'deal' | 'project' | 'product'; label: string; status?: string; dealValue?: number };
  isAr: boolean;
}) {
  if (entity.type === 'deal') {
    const statusStyle = entity.status ? DEAL_STATUS_STYLES[entity.status] : null;
    return (
      <div className="flex items-center gap-1">
        <Badge variant="secondary" className="text-[10px] gap-1 py-0">
          <Handshake className="h-2.5 w-2.5" />
          {entity.label}
        </Badge>
        {statusStyle && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className={cn('h-1.5 w-1.5 rounded-full', statusStyle.dot)} />
            {isAr ? statusStyle.labelAr : statusStyle.labelEn}
          </span>
        )}
        {entity.dealValue != null && entity.dealValue > 0 && (
          <span className="text-[10px] text-muted-foreground font-medium">
            {formatSAR(entity.dealValue, isAr ? 'ar' : 'en')}
          </span>
        )}
      </div>
    );
  }

  if (entity.type === 'project') {
    return (
      <Badge variant="secondary" className="text-[10px] gap-1 py-0">
        <FolderOpen className="h-2.5 w-2.5" />
        {entity.label}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="text-[10px] gap-1 py-0">
      <Package className="h-2.5 w-2.5" />
      {entity.label}
    </Badge>
  );
}
