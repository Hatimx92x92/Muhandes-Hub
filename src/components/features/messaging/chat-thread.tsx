// =============================================================================
// Muhandes HUB — Chat Thread Client Component
// =============================================================================

'use client';

import { useRef, useEffect, useActionState, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { sendMessage, markAsRead } from '@/actions/messages';
import { MessageBubble } from './message-bubble';
import { Button } from '@/components/ui/button';
import { Send, Zap, Paperclip, X, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealtimeMessages, type RealtimeMessage } from '@/hooks/use-realtime-messages';
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
  attachments?: Array<{ url: string; name: string; size: number; mimeType: string }> | null;
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
  locale?: string;
  initialUnreadCount?: number;
}

type State = ActionResult<{ id: string }> | null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatThread({
  conversationId,
  currentUserId,
  messages: initialMessages,
  quickReplies,
  locale = 'ar',
  initialUnreadCount = 0,
}: ChatThreadProps) {
  const [state, formAction, isPending] = useActionState<State, FormData>(sendMessage, null);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const t = useTranslations('features.chatThread');
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert initial prop messages to RealtimeMessage shape for the hook
  const normalizedInitial: RealtimeMessage[] = initialMessages.map((m) => ({
    id: m.id,
    conversation_id: conversationId,
    sender_id: m.senderId,
    content: m.content,
    created_at: m.createdAt,
    deleted_at: null,
    file_url: m.fileUrl,
    file_name: m.fileName,
    file_size: m.fileSize,
    attachments: m.attachments ?? null,
  }));

  // Live messages from Supabase Realtime
  const { messages: liveMessages, typingUsers, sendTypingIndicator } = useRealtimeMessages({
    conversationId,
    currentUserId,
    initialMessages: normalizedInitial,
  });

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((smooth = false) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'instant',
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [liveMessages.length, scrollToBottom]);

  // Mark conversation as read on mount (moved from Server Component to avoid revalidatePath throw)
  useEffect(() => {
    if (initialUnreadCount > 0) {
      markAsRead(conversationId);
    }
  }, [conversationId, initialUnreadCount]);

  // Clear input on successful send
  useEffect(() => {
    if (state?.data?.id) {
      formRef.current?.reset();
      setAttachedFiles([]);
      inputRef.current?.focus();
    }
  }, [state]);

  // Quick reply selection
  const handleQuickReply = useCallback(
    (content: string) => {
      if (inputRef.current) {
        inputRef.current.value = content;
        inputRef.current.focus();
      }
      setShowQuickReplies(false);
    },
    [],
  );

  // Handle Enter key to send (Shift+Enter for new line)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }, []);

  // Add files (deduplicate by name+size)
  const addFiles = useCallback((incoming: File[]) => {
    setAttachedFiles((prev) => {
      const existing = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const fresh = incoming.filter((f) => !existing.has(`${f.name}-${f.size}`));
      return [...prev, ...fresh];
    });
  }, []);

  const removeFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Drag-and-drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files);
      if (dropped.length > 0) addFiles(dropped);
    },
    [addFiles],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []);
      if (selected.length > 0) addFiles(selected);
      // Reset input so same files can be re-selected
      e.target.value = '';
    },
    [addFiles],
  );

  return (
    <>
      {/* Messages Area with drag-and-drop */}
      <div
        ref={scrollRef}
        className={cn(
          'relative flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20 transition-colors',
          isDragging && 'bg-primary/5 ring-2 ring-inset ring-primary/30',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-t-xl bg-primary/10">
            <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-primary bg-background/90 px-8 py-6 shadow-lg">
              <Paperclip className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-primary">{t('dropFiles')}</span>
            </div>
          </div>
        )}

        {liveMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {t('startConversation')}
          </div>
        ) : (
          liveMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              content={msg.content}
              isMine={msg.sender_id === currentUserId}
              createdAt={msg.created_at}
              fileUrl={msg.file_url}
              fileName={msg.file_name}
              fileSize={msg.file_size}
              attachments={msg.attachments ?? undefined}
              locale={locale}
            />
          ))
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 ps-1">
            <div className="flex gap-0.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </div>
            <span className="text-xs text-muted-foreground italic">{t('typing')}</span>
          </div>
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
                onClick={() => handleQuickReply(locale === 'ar' ? qr.contentAr : qr.contentEn)}
                className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-foreground hover:bg-muted transition-colors"
              >
                {locale === 'ar' ? qr.contentAr : qr.contentEn}
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

        {/* Hidden multi-file input */}
        <input
          ref={fileInputRef}
          type="file"
          name="files"
          multiple
          className="hidden"
          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp"
          onChange={handleFileInputChange}
        />

        {/* Attached files chips */}
        {attachedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {attachedFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs max-w-50"
              >
                {isImage(file) ? (
                  <Image className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate flex-1">{file.name}</span>
                <span className="shrink-0 text-muted-foreground/70">{formatFileSize(file.size)}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="ms-0.5 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

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

          {/* File attachment button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
            title={t('attachFile')}
          >
            <Paperclip className="h-5 w-5" />
          </button>

          {/* Message input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              name="content"
              placeholder={t('typeMessage')}
              rows={1}
              onKeyDown={handleKeyDown}
              onChange={sendTypingIndicator}
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
