// =============================================================================
// Muqawil HUB — Chat Thread Client Component
// =============================================================================

'use client';

import { useRef, useEffect, useActionState, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { sendMessage } from '@/actions/messages';
import { MessageBubble } from './message-bubble';
import { Button } from '@/components/ui/button';
import { Send, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActionResult } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  senderId: string;
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  createdAt: string;
  isMine: boolean;
}

interface QuickReply {
  id: string;
  contentAr: string;
  contentEn: string;
}

interface ChatThreadProps {
  conversationId: string;
  currentUserId: string;
  messages: Message[];
  quickReplies: QuickReply[];
}

type State = ActionResult<{ id: string }> | null;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatThread({
  conversationId,
  currentUserId,
  messages: initialMessages,
  quickReplies,
}: ChatThreadProps) {
  const [state, formAction, isPending] = useActionState<State, FormData>(sendMessage, null);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const t = useTranslations('features.chatThread');
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [initialMessages.length, scrollToBottom]);

  // Clear input on successful send
  useEffect(() => {
    if (state?.data?.id) {
      formRef.current?.reset();
      inputRef.current?.focus();
    }
  }, [state]);

  // Quick reply selection
  const handleQuickReply = useCallback((content: string) => {
    if (inputRef.current) {
      inputRef.current.value = content;
      inputRef.current.focus();
    }
    setShowQuickReplies(false);
  }, []);

  // Handle Enter key to send (Shift+Enter for new line)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    },
    [],
  );

  return (
    <>
      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20"
      >
        {initialMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {t('startConversation')}
          </div>
        ) : (
          initialMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              content={msg.content}
              isMine={msg.isMine}
              createdAt={msg.createdAt}
              fileUrl={msg.fileUrl}
              fileName={msg.fileName}
              fileSize={msg.fileSize}
            />
          ))
        )}
      </div>

      {/* Quick Replies Panel */}
      {showQuickReplies && quickReplies.length > 0 && (
        <div className="border-t border-border bg-card px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((qr) => (
              <button
                key={qr.id}
                type="button"
                onClick={() => handleQuickReply(qr.contentAr)}
                className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-foreground hover:bg-muted transition-colors"
              >
                {qr.contentAr}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error display */}
      {state?.error && (
        <div className="px-4 py-2 text-sm text-destructive bg-destructive/10 border-t border-destructive/20">
          {state.error}
        </div>
      )}

      {/* Input Area */}
      <form
        ref={formRef}
        action={formAction}
        className="border-t border-border bg-card px-4 py-3 rounded-b-xl"
      >
        <input type="hidden" name="conversation_id" value={conversationId} />
        <div className="flex items-end gap-2">
          {/* Quick reply toggle */}
          {quickReplies.length > 0 && (
            <button
              type="button"
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              className={cn(
                'shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors',
                showQuickReplies && 'bg-muted text-foreground',
              )}
              title={t('quickReplies')}
            >
              <Zap className="h-5 w-5" />
            </button>
          )}

          {/* Message input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              name="content"
              placeholder={t('typeMessage')}
              rows={1}
              required
              onKeyDown={handleKeyDown}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring max-h-32"
              style={{ minHeight: '2.5rem' }}
            />
          </div>

          {/* Send button */}
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isPending}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </>
  );
}
