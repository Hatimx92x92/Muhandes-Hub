// =============================================================================
// Deal Chat — Real-time messaging within deal workspace
// =============================================================================

'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRealtimeMessages } from '@/hooks/use-realtime-messages';
import { getOrCreateDealConversation, sendMessage } from '@/actions/messages';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/features/empty-state';
import { cn } from '@/lib/utils';
import { Send, Paperclip, Loader2, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DealChatProps {
  dealId: string;
  userId: string;
  buyerName: string;
  sellerName: string;
  buyerId: string;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
  file_url?: string | null;
  file_name?: string | null;
}

export function DealChat({ dealId, userId, buyerName, sellerName, buyerId }: DealChatProps) {
  const t = useTranslations('dashboard.deals');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [sending, setSending] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize conversation
  useEffect(() => {
    let mounted = true;
    async function init() {
      const result = await getOrCreateDealConversation(dealId);
      if (!mounted) return;
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setConversationId(result.data!.conversationId);
      setInitialMessages(result.data!.messages as ChatMessage[]);
      setLoading(false);
    }
    init();
    return () => { mounted = false; };
  }, [dealId]);

  // Real-time messages
  const { messages, typingUsers, sendTypingIndicator } = useRealtimeMessages({
    conversationId: conversationId || '',
    currentUserId: userId,
    initialMessages: initialMessages as Array<{
      id: string;
      conversation_id: string;
      sender_id: string;
      content: string;
      created_at: string;
      deleted_at: string | null;
    }>,
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!content.trim() || !conversationId) return;
    const messageContent = content.trim();
    setContent('');
    setSending(async () => {
      const fd = new FormData();
      fd.set('conversation_id', conversationId);
      fd.set('content', messageContent);
      await sendMessage(null, fd);
      inputRef.current?.focus();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      sendTypingIndicator();
    }
  };

  const getParticipantName = (senderId: string) => {
    if (senderId === userId) return t('you');
    return senderId === buyerId ? buyerName : sellerName;
  };

  if (loading) {
    return (
      <Card className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-12 w-12" />}
        title={t('chatError')}
        description={error}
      />
    );
  }

  return (
    <Card className="flex h-[500px] flex-col overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">{t('startConversation')}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === userId;
            return (
              <div
                key={msg.id}
                className={cn(
                  'flex flex-col max-w-[75%]',
                  isOwn ? 'ms-auto items-end' : 'items-start',
                )}
              >
                <span className="mb-0.5 text-xs text-muted-foreground">
                  {getParticipantName(msg.sender_id)}
                </span>
                <div
                  className={cn(
                    'rounded-xl px-3.5 py-2 text-sm',
                    isOwn
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground',
                  )}
                >
                  {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                  {(msg as ChatMessage).file_url && (
                    <a
                      href={(msg as ChatMessage).file_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'mt-1 flex items-center gap-1 text-xs underline',
                        isOwn ? 'text-primary-foreground/80' : 'text-primary',
                      )}
                    >
                      <Paperclip className="h-3 w-3" />
                      {(msg as ChatMessage).file_name || t('attachment')}
                    </a>
                  )}
                </div>
                <span className="mt-0.5 text-[10px] text-muted-foreground">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="text-xs text-muted-foreground italic">
            {t('typing')}...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('typeMessage')}
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            dir="auto"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!content.trim() || sending}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
