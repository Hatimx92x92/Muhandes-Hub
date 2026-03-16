'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface FileUploadProps {
  name: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  maxFiles?: number;
  label?: string;
  hint?: string;
  error?: string;
  onUpload?: (files: File[]) => void;
  className?: string;
}

export function FileUpload({
  name,
  accept,
  multiple = false,
  maxSize = 10,
  maxFiles = 5,
  label,
  hint,
  error,
  onUpload,
  className,
}: FileUploadProps) {
  const t = useTranslations('forms.fileUpload');
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback(
    (newFiles: File[]): File[] => {
      setFileError(null);
      const maxBytes = maxSize * 1024 * 1024;

      const valid = newFiles.filter((file) => {
        if (file.size > maxBytes) {
          setFileError(
            t('fileSizeError', { name: file.name, maxSize: String(maxSize) }),
          );
          return false;
        }
        return true;
      });

      if (!multiple) return valid.slice(0, 1);
      return valid.slice(0, maxFiles);
    },
    [maxSize, maxFiles, multiple, t],
  );

  const handleFiles = useCallback(
    (newFiles: File[]) => {
      const validated = validateFiles(newFiles);
      const updated = multiple ? [...files, ...validated].slice(0, maxFiles) : validated;
      setFiles(updated);
      onUpload?.(updated);
    },
    [files, validateFiles, multiple, maxFiles, onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const dropped = Array.from(e.dataTransfer.files);
      handleFiles(dropped);
    },
    [handleFiles],
  );

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onUpload?.(updated);
  };

  const isImage = (file: File) => file.type.startsWith('image/');

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}

      {/* Drop zone */}
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed p-6 text-center transition-colors',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          error || fileError ? 'border-destructive' : '',
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            const selected = Array.from(e.target.files || []);
            handleFiles(selected);
            e.target.value = '';
          }}
        />

        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          {t('dragHint')}{' '}
          <button
            type="button"
            className="text-primary underline"
            onClick={() => inputRef.current?.click()}
          >
            {t('browse')}
          </button>
        </p>
        {hint && (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )}
      </div>

      {/* Error message */}
      {(error || fileError) && (
        <p className="text-sm text-destructive">{error || fileError}</p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-2 rounded-lg border p-2 text-sm"
            >
              {isImage(file) ? (
                <ImageIcon className="h-4 w-4 text-blue-500" />
              ) : (
                <FileText className="h-4 w-4 text-orange-500" />
              )}
              <span className="flex-1 truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(i)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
