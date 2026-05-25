// =============================================================================
// Deal Chat — Real-time messaging within deal workspace
// =============================================================================

'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRealtimeMessages } from '@/hooks/use-realtime-messages';
import { getOrCreateDealConversation, sendMessage } from '@/actions/messages';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/features/empty-state';
import { cn, formatSAR } from '@/lib/utils';
import { Send, Paperclip, Loader2, MessageSquare, X, FileText, Image } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { getProxyUrl } from '@/lib/file-utils';
import type { DealStatus } from '@/types/enums';

interface DealChatProps {
  dealId: string;
  userId: string;
  buyerName: string;
  sellerName: string;
  buyerId: string;
  dealStatus?: DealStatus;
  dealValue?: number;
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
  attachments?: Array<{ url: string; name: string; size: number; mimeType: string }> | null;
}

const DEAL_STATUS_STYLES: Record<DealStatus, { labelAr: string; labelEn: string; className: string }> = {
  active:      { labelAr: 'نشطة',         labelEn: 'Active',      className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  in_progress: { labelAr: 'قيد التنفيذ',   labelEn: 'In Progress', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  completed:   { labelAr: 'مكتملة',        labelEn: 'Completed',   className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  cancelled:   { labelAr: 'ملغاة',          labelEn: 'Cancelled',   className: 'bg-muted text-muted-foreground border-border' },
  disputed:    { labelAr: 'متنازع عليها',  labelEn: 'Disputed',    className: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

export function DealChat({ dealId, userId, buyerName, sellerName, buyerId, dealStatus, dealValue }: DealChatProps) {
  const t = useTranslations('dashboard.deals');
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [sending, setSending] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if ((!content.trim() && attachedFiles.length === 0) || !conversationId) return;
    const messageContent = content.trim();
    const filesToSend = [...attachedFiles];
    setContent('');
    setAttachedFiles([]);
    setSending(async () => {
      const fd = new FormData();
      fd.set('conversation_id', conversationId);
      fd.set('content', messageContent);
      for (const f of filesToSend) {
        fd.append('files', f);
      }
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

  const statusStyle = dealStatus ? DEAL_STATUS_STYLES[dealStatus] : null;

  return (
    <Card className="flex h-125 flex-col overflow-hidden">
      {/* Deal header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-muted/20 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{t('chat')}</span>
          {statusStyle && (
            <Badge
              variant="outline"
              className={cn('text-[10px] border', statusStyle.className)}
            >
              {isAr ? statusStyle.labelAr : statusStyle.labelEn}
            </Badge>
          )}
        </div>
        {dealValue != null && dealValue > 0 && (
          <span className="text-xs font-medium text-muted-foreground">
            {formatSAR(dealValue, locale)}
          </span>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">{t('startConversation')}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === userId;
            const allAttachments = msg.attachments && msg.attachments.length > 0
              ? msg.attachments
              : (msg as ChatMessage).file_url && (msg as ChatMessage).file_name
                ? [{ url: (msg as ChatMessage).file_url!, name: (msg as ChatMessage).file_name!, size: 0, mimeType: '' }]
                : [];

            return (
              <div
                key={msg.id}
                className={cn('flex flex-col max-w-[75%]', isOwn ? 'ms-auto items-end' : 'items-start')}
              >
                <span className="mb-0.5 text-xs text-muted-foreground">
                  {getParticipantName(msg.sender_id)}
                </span>
                <div
                  className={cn(
                    'rounded-xl px-3.5 py-2 text-sm',
                    isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                  )}
                >
                  {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                  {allAttachments.map((att, i) =>
                    att.mimeType?.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={getProxyUrl(att.url)}
                        alt={att.name}
                        className="mt-1 max-w-48 rounded-lg object-cover"
                      />
                    ) : (
                      <a
                        key={i}
                        href={getProxyUrl(att.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'mt-1 flex items-center gap-1 text-xs underline',
                          isOwn ? 'text-primary-foreground/80' : 'text-primary',
                        )}
                      >
                        <Paperclip className="h-3 w-3" />
                        {att.name || t('attachment')}
                      </a>
                    )
                  )}
                </div>
                <span className="mt-0.5 text-[10px] text-muted-foreground">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 ps-1">
            <div className="flex gap-0.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </div>
            <span className="text-xs text-muted-foreground italic">{t('typing')}...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border p-3 shrink-0">
        {/* Attached file chips */}
        {attachedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {attachedFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs max-w-40"
              >
                {file.type.startsWith('image/') ? (
                  <Image className="h-3 w-3 shrink-0 text-muted-foreground" />
                ) : (
                  <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachedFiles((p) => p.filter((_, j) => j !== i))}
                  className="ms-0.5 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* File attachment */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length > 0) setAttachedFiles((p) => [...p, ...files]);
              e.target.value = '';
            }}
          />

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
            disabled={(!content.trim() && attachedFiles.length === 0) || sending}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}
