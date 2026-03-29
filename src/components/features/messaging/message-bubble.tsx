// =============================================================================
// Muhandes HUB — Message Bubble Component
// =============================================================================

import { cn } from '@/lib/utils';
import { FileText, Download } from 'lucide-react';
import { useLocale } from 'next-intl';

interface MessageBubbleProps {
  content: string;
  isMine: boolean;
  createdAt: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
}

function formatTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessageBubble({
  content,
  isMine,
  createdAt,
  fileUrl,
  fileName,
  fileSize,
}: MessageBubbleProps) {
  const locale = useLocale();
  return (
    <div className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
          isMine
            ? 'bg-primary text-primary-foreground rounded-es-sm'
            : 'bg-card border border-border text-foreground rounded-ee-sm',
        )}
      >
        {/* Message content */}
        <p className="whitespace-pre-wrap wrap-break-word leading-relaxed">{content}</p>

        {/* File attachment */}
        {fileUrl && fileName && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'mt-2 flex items-center gap-2 rounded-lg p-2 transition-colors',
              isMine
                ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20'
                : 'bg-muted hover:bg-muted/80',
            )}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{fileName}</p>
              {fileSize && (
                <p className="text-[10px] opacity-70">{formatFileSize(fileSize)}</p>
              )}
            </div>
            <Download className="h-3.5 w-3.5 shrink-0 opacity-60" />
          </a>
        )}

        {/* Timestamp */}
        <p
          className={cn(
            'mt-1 text-[10px]',
            isMine ? 'text-primary-foreground/60' : 'text-muted-foreground',
          )}
        >
          {formatTime(createdAt, locale)}
        </p>
      </div>
    </div>
  );
}
