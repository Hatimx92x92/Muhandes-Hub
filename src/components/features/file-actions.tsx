// =============================================================================
// File Actions — Reusable preview + download buttons for any file
// =============================================================================

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilePreviewModal } from '@/components/features/file-preview-modal';
import { getDownloadUrl, isPreviewable } from '@/lib/file-utils';

interface FileActionsProps {
  /** Raw storage URL (Supabase or already proxied) */
  url: string;
  /** The display file name */
  fileName: string;
  /** Compact mode — icon buttons only */
  compact?: boolean;
  /** Optional extra className for the wrapper */
  className?: string;
}

export function FileActions({ url, fileName, compact = false, className }: FileActionsProps) {
  const t = useTranslations('components.fileDisplay');
  const [previewOpen, setPreviewOpen] = useState(false);

  const canPreview = isPreviewable(fileName);
  const downloadUrl = getDownloadUrl(url);

  return (
    <>
      <div className={className ?? 'flex items-center gap-1'}>
        {canPreview && (
          <Button
            variant="ghost"
            size={compact ? 'icon' : 'sm'}
            onClick={() => setPreviewOpen(true)}
            title={t('preview')}
            className={compact ? 'h-8 w-8' : undefined}
          >
            <Eye className="h-4 w-4" />
            {!compact && <span className="ms-1">{t('preview')}</span>}
          </Button>
        )}
        <a href={downloadUrl} download={fileName}>
          <Button
            variant="ghost"
            size={compact ? 'icon' : 'sm'}
            title={t('download')}
            className={compact ? 'h-8 w-8' : undefined}
          >
            <Download className="h-4 w-4" />
            {!compact && <span className="ms-1">{t('download')}</span>}
          </Button>
        </a>
      </div>

      {canPreview && (
        <FilePreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          fileUrl={url}
          fileName={fileName}
        />
      )}
    </>
  );
}
