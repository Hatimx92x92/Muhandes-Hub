// =============================================================================
// Document Vault — Client Component for Deal Document Management
// =============================================================================

'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadDealDocument } from '@/actions/uploads';
import {
  Upload, FileText, Image, File, Download, FolderOpen, X,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DealDocument {
  id: string;
  category: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  notes: string | null;
  created_at: string;
  uploader: { full_name: string } | null;
}

interface DocumentVaultProps {
  dealId: string;
  documents: DealDocument[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  'all',
  'contracts',
  'drawings',
  'specs',
  'permits',
  'invoices',
  'correspondence',
  'general',
] as const;

const CATEGORY_VARIANT: Record<string, 'default' | 'info' | 'pending' | 'success'> = {
  contracts: 'info',
  drawings: 'pending',
  specs: 'default',
  permits: 'success',
  invoices: 'pending',
  correspondence: 'default',
  general: 'default',
};

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType === 'application/pdf') return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocumentVault({ dealId, documents }: DocumentVaultProps) {
  const t = useTranslations('dashboard.deals');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = activeCategory === 'all'
    ? documents
    : documents.filter(d => d.category === activeCategory);

  const handleUpload = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await uploadDealDocument(dealId, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setShowUpload(false);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{t('documentVault')}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUpload(!showUpload)}
        >
          {showUpload ? <X className="h-4 w-4 me-1" /> : <Upload className="h-4 w-4 me-1" />}
          {showUpload ? t('cancel') : t('uploadDocument')}
        </Button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <Card className="p-4 space-y-3">
          <form action={handleUpload} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('docFile')}</label>
              <input
                type="file"
                name="document"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                required
                className="block w-full text-sm file:me-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('docCategory')}</label>
              <Select name="category" defaultValue="general">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter(c => c !== 'all').map(cat => (
                    <SelectItem key={cat} value={cat}>{t(`docCat_${cat}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('docNotes')}</label>
              <input
                type="text"
                name="notes"
                placeholder={t('docNotesPlaceholder')}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" variant="primary" size="sm" loading={isPending}>
              <Upload className="h-4 w-4 me-1" />
              {t('upload')}
            </Button>
          </form>
        </Card>
      )}

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              activeCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {t(`docCat_${cat}`)}
            {cat !== 'all' && (
              <span className="ms-1 opacity-70">
                ({documents.filter(d => d.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Document List */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{t('noDocuments')}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => {
            const Icon = getFileIcon(doc.mime_type);
            return (
              <Card key={doc.id} className="p-3 flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{doc.file_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={CATEGORY_VARIANT[doc.category] || 'default'} className="text-[10px]">
                      {t(`docCat_${doc.category}`)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(doc.file_size)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {doc.notes && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{doc.notes}</p>
                  )}
                </div>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
