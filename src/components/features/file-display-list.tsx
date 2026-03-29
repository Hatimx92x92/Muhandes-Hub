// =============================================================================
// File Display List — Read-Only file display grouped by category
// =============================================================================

import { FileText, Image as ImageIcon, Download, FileSpreadsheet, File } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export interface DisplayFile {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  category?: string;
}

interface FileDisplayListProps {
  files: DisplayFile[];
  title?: string;
  grouped?: boolean;
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  boq: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  drawings: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  images: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  specs: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  catalog: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  general: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-green-600" />;
  if (mimeType === 'application/pdf') return <FileText className="h-4 w-4 text-red-600" />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
    return <FileSpreadsheet className="h-4 w-4 text-green-700" />;
  if (mimeType.includes('word') || mimeType.includes('document'))
    return <FileText className="h-4 w-4 text-blue-600" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileCategoryBadge({ category }: { category: string }) {
  const t = useTranslations('components.fileDisplay');
  const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.general;
  const label = t.has(category) ? t(category as 'boq') : category;

  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', colorClass)}>
      {label}
    </span>
  );
}

export function FileDisplayList({ files, title, grouped = true, className }: FileDisplayListProps) {
  const t = useTranslations('components.fileDisplay');

  if (!files || files.length === 0) return null;

  // Group files by category
  const groupedFiles = grouped
    ? files.reduce<Record<string, DisplayFile[]>>((acc, file) => {
        const cat = file.category || 'general';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(file);
        return acc;
      }, {})
    : { all: files };

  return (
    <Card className={cn('p-6', className)}>
      {title && (
        <h2 className="mb-4 text-lg font-semibold text-foreground">{title}</h2>
      )}

      <div className="space-y-4">
        {Object.entries(groupedFiles).map(([category, categoryFiles]) => (
          <div key={category}>
            {grouped && category !== 'all' && (
              <div className="mb-2 flex items-center gap-2">
                <FileCategoryBadge category={category} />
                <span className="text-xs text-muted-foreground">
                  ({categoryFiles.length} {t('files')})
                </span>
              </div>
            )}
            <ul className="space-y-2">
              {categoryFiles.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                >
                  {getFileIcon(file.mime_type)}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</p>
                  </div>
                  <a
                    href={file.file_url}
                    download={file.file_name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
