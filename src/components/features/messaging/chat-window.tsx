// =============================================================================
// Muqawil HUB — Chat Window Component
// Real-time messaging with typing indicators
// =============================================================================

'use client';

import { useRef, useEffect, useActionState, useCallback } from 'react';
import { Send } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useRealtimeMessages } from '@/hooks/use-realtime-messages';
import { sendMessage } from '@/actions/messages';
import { formatRelativeTime, cn } from '@/lib/utils';

interface MessageData {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
}

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  initialMessages: MessageData[];
  participantName: string;
}

export function ChatWindow({
  conversationId,
  currentUserId,
  initialMessages,
  participantName,
}: ChatWindowProps) {
  const t = useTranslations('features.chatWindow');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, typingUsers, sendTypingIndicator } = useRealtimeMessages({
    conversationId,
    currentUserId,
    initialMessages,
  });

  const [_state, formAction, isPending] = useActionState(sendMessage, null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') {
        sendTypingIndicator();
      }
    },
    [sendTypingIndicator],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card">
        <h3 className="font-semibold text-foreground">{participantName}</h3>
        {typingUsers.length > 0 && (
          <p className="text-xs text-primary animate-pulse">
            {t('typing')}
          </p>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <p>{t('startConversation')}</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              className={cn(
                'flex',
                isOwn ? 'justify-end' : 'justify-start',
              )}
            >
              <div
                className={cn(
                  'max-w-[70%] px-4 py-2 rounded-2xl text-sm',
                  isOwn
                    ? 'bg-primary text-primary-foreground rounded-ee-sm'
                    : 'bg-muted text-foreground rounded-es-sm',
                )}
              >
                <p className="whitespace-pre-wrap wrap-break-word">{msg.content}</p>
                <p
                  className={cn(
                    'text-[10px] mt-1',
                    isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground',
                  )}
                >
                  {formatRelativeTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-muted px-4 py-2 rounded-2xl rounded-es-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        action={formAction}
        className="px-4 py-3 border-t border-border bg-card"
      >
        <input type="hidden" name="conversation_id" value={conversationId} />
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            name="content"
            type="text"
            placeholder={t('typeMessage')}
            className="flex-1 px-4 py-2 rounded-full border border-input bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            autoComplete="off"
            onKeyDown={handleKeyDown}
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending}
            className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary-dark disabled:opacity-50 transition-all duration-200"
            aria-label={t('send')}
          >
            <Send size={18} className={isRTL ? 'rotate-180' : ''} />
          </button>
        </div>
      </form>
    </div>
  );
}
