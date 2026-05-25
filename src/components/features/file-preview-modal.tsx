// =============================================================================
// File Preview Modal — In-app PDF / image preview with download
// =============================================================================

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProxyUrl, getDownloadUrl, isPdf, isImage } from '@/lib/file-utils';

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  fileName: string;
}

export function FilePreviewModal({
  open,
  onOpenChange,
  fileUrl,
  fileName,
}: FilePreviewModalProps) {
  const t = useTranslations('components.fileDisplay');
  const [loading, setLoading] = useState(true);

  const proxyUrl = getProxyUrl(fileUrl);
  const downloadUrl = getDownloadUrl(fileUrl);
  const filePdf = isPdf(fileName);
  const fileImage = isImage(fileName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex flex-col p-0 gap-0',
          'sm:max-w-4xl max-h-[90vh] w-[95vw]',
        )}
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between gap-2 border-b border-border px-4 py-3">
          <DialogTitle className="min-w-0 flex-1 truncate text-sm font-medium">
            {fileName}
          </DialogTitle>
          <div className="flex items-center gap-1 shrink-0">
            <a href={downloadUrl} download={fileName}>
              <Button variant="ghost" size="icon" className="h-8 w-8" title={t('downloadFile')}>
                <Download className="h-4 w-4" />
              </Button>
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
              title={t('close')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="relative flex-1 overflow-hidden bg-muted/30">
          {filePdf ? (
            <>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              <iframe
                src={proxyUrl}
                title={fileName}
                className="h-[75vh] w-full border-0"
                onLoad={() => setLoading(false)}
              />
            </>
          ) : fileImage ? (
            <div className="flex items-center justify-center p-4">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proxyUrl}
                alt={fileName}
                className="max-h-[75vh] max-w-full rounded-lg object-contain"
                onLoad={() => setLoading(false)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('noPreview')}</p>
              <a href={downloadUrl} download={fileName}>
                <Button variant="primary" size="sm">
                  <Download className="h-4 w-4 me-2" />
                  {t('downloadFile')}
                </Button>
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
