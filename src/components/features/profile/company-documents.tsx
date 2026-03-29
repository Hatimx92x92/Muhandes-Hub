'use client';

import { useState, useRef, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { uploadCompanyDocument, deleteCompanyDocument, updateCompanyDocumentName } from '@/actions/profile';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FileText, Upload, Trash2, Download, Pencil, Check, X, Loader2 } from 'lucide-react';
import { AlertBanner } from '@/components/ui/alert-banner';

// =============================================================================
// Company Documents — upload, rename, delete (max 3 PDFs)
// =============================================================================

interface CompanyDocument {
  id: string;
  display_name: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

interface CompanyDocumentsProps {
  documents: CompanyDocument[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CompanyDocuments({ documents: initialDocs }: CompanyDocumentsProps) {
  const t = useTranslations('forms.profile.documents');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const docs = initialDocs;

  const handleUpload = async (file: File) => {
    if (!displayName.trim()) {
      setError(t('nameRequired'));
      return;
    }
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set('file', file);
    formData.set('display_name', displayName.trim());

    const result = await uploadCompanyDocument(formData);
    setUploading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setDisplayName('');
    startTransition(() => router.refresh());
  };

  const handleDelete = async (docId: string) => {
    setError(null);
    const result = await deleteCompanyDocument(docId);
    if (result.error) {
      setError(result.error);
      return;
    }
    startTransition(() => router.refresh());
  };

  const handleRename = async (docId: string) => {
    if (!editName.trim()) return;
    setError(null);
    const result = await updateCompanyDocumentName(docId, editName.trim());
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditingId(null);
    startTransition(() => router.refresh());
  };

  const canUpload = docs.length < 3;

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        {t('title')}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {t('subtitle', { count: docs.length, max: 3 })}
      </p>

      {error && (
        <AlertBanner variant="error" className="mb-4">{error}</AlertBanner>
      )}

      {/* Document list */}
      {docs.length > 0 && (
        <div className="space-y-3 mb-6">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
            >
              <FileText className="h-8 w-8 shrink-0 text-destructive/70" />
              <div className="min-w-0 flex-1">
                {editingId === doc.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleRename(doc.id)}
                      className="text-primary hover:text-primary/80"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-foreground text-sm truncate">
                      {doc.display_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {doc.file_name} &middot; {formatFileSize(doc.file_size)}
                    </p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Download className="h-4 w-4" />
                </a>
                {editingId !== doc.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(doc.id);
                      setEditName(doc.display_name);
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  disabled={isPending}
                  className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload new document */}
      {canUpload && (
        <div className="space-y-3">
          <Input
            label={t('documentName')}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t('documentNamePlaceholder')}
            maxLength={100}
          />
          <div
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-primary/50 cursor-pointer',
              uploading && 'opacity-50 pointer-events-none',
            )}
            onClick={() => displayName.trim() && fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{t('dropzone')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('pdfOnly')}</p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = '';
            }}
          />
          {!displayName.trim() && (
            <p className="text-xs text-muted-foreground">{t('enterNameFirst')}</p>
          )}
        </div>
      )}

      {!canUpload && (
        <p className="text-sm text-muted-foreground">{t('maxReached')}</p>
      )}
    </div>
  );
}
