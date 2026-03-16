'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { uploadAvatar, uploadLogo } from '@/actions/uploads';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface AvatarUploadProps {
  currentUrl?: string | null;
  type: 'avatar' | 'logo';
  size?: 'sm' | 'md' | 'lg';
  onUploaded?: (url: string) => void;
  className?: string;
}

const SIZE_MAP = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
};

export function AvatarUpload({
  currentUrl,
  type,
  size = 'md',
  onUploaded,
  className,
}: AvatarUploadProps) {
  const t = useTranslations('forms.avatarUpload');
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(currentUrl);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set(type === 'avatar' ? 'avatar' : 'logo', file);

    const result = type === 'avatar'
      ? await uploadAvatar(formData)
      : await uploadLogo(formData);

    setUploading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.data?.url) {
      setUrl(result.data.url);
      onUploaded?.(result.data.url);
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <button
        type="button"
        className={cn(
          'relative overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary/50',
          SIZE_MAP[size],
        )}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={type === 'avatar' ? 'Avatar' : 'Logo'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Camera className="h-6 w-6 text-muted-foreground" />
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = '';
        }}
      />

      <span className="text-xs text-muted-foreground">
        {type === 'avatar' ? t('profilePhoto') : t('companyLogo')}
      </span>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
