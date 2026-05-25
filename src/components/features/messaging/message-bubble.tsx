// =============================================================================
// Muhandes HUB — Message Bubble Component
// =============================================================================

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FileText, Download, Eye } from 'lucide-react';
import { useLocale } from 'next-intl';
import { getProxyUrl, getDownloadUrl, isPreviewable } from '@/lib/file-utils';
import { FilePreviewModal } from '@/components/features/file-preview-modal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Attachment {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

interface MessageBubbleProps {
  content: string;
  isMine: boolean;
  createdAt: string;
  locale?: string;
  // Legacy single-file (kept for backward compat)
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  // Multi-file (new)
  attachments?: Attachment[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Sub-component: single attachment chip / inline image
// ---------------------------------------------------------------------------

function AttachmentItem({
  attachment,
  isMine,
}: {
  attachment: Attachment;
  isMine: boolean;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const isImg = attachment.mimeType.startsWith('image/');
  const canPreview = isPreviewable(attachment.name);

  if (isImg) {
    return (
      <div className="mt-2 overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getProxyUrl(attachment.url)}
          alt={attachment.name}
          className="max-w-60 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setPreviewOpen(true)}
        />
        {previewOpen && (
          <FilePreviewModal
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            fileUrl={attachment.url}
            fileName={attachment.name}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'mt-2 flex items-center gap-2 rounded-lg p-2',
          isMine ? 'bg-primary-foreground/10' : 'bg-muted',
        )}
      >
        <FileText className="h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium truncate">{attachment.name}</p>
          <p className="text-[10px] opacity-70">{formatFileSize(attachment.size)}</p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {canPreview && (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
          <a
            href={getDownloadUrl(attachment.url)}
            download={attachment.name}
            className="rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {canPreview && (
        <FilePreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          fileUrl={attachment.url}
          fileName={attachment.name}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MessageBubble({
  content,
  isMine,
  createdAt,
  locale,
  fileUrl,
  fileName,
  fileSize,
  attachments,
}: MessageBubbleProps) {
  const hookLocale = useLocale();
  const effectiveLocale = locale ?? hookLocale;

  // Build unified attachment list: prefer `attachments` array; fall back to legacy single-file
  const allAttachments: Attachment[] = attachments && attachments.length > 0
    ? attachments
    : fileUrl && fileName
      ? [{ url: fileUrl, name: fileName, size: fileSize ?? 0, mimeType: guessMimeFromName(fileName) }]
      : [];

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
        {/* Message text */}
        {content && (
          <p className="whitespace-pre-wrap wrap-break-word leading-relaxed">{content}</p>
        )}

        {/* Attachments */}
        {allAttachments.map((att, i) => (
          <AttachmentItem key={`${att.url}-${i}`} attachment={att} isMine={isMine} />
        ))}

        {/* Timestamp */}
        <p
          className={cn(
            'mt-1 text-[10px]',
            isMine ? 'text-primary-foreground/60' : 'text-muted-foreground',
          )}
        >
          {formatTime(createdAt, effectiveLocale)}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utility: guess MIME type from filename extension (for legacy messages)
// ---------------------------------------------------------------------------

function guessMimeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return map[ext] ?? 'application/octet-stream';
}
