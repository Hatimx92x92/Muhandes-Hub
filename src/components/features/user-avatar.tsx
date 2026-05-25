'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// UserAvatar — Universal avatar with MuhandesHub logo fallback
// =============================================================================

const SIZE_MAP = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
  '2xl': 'h-20 w-20',
} as const;

const PX_MAP: Record<keyof typeof SIZE_MAP, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  '2xl': 80,
};

const FALLBACK_LOGO = '/logo.png';

interface UserAvatarProps {
  /** Primary image: logo_url or avatar_url */
  src?: string | null;
  /** Fallback name for alt text */
  name?: string;
  /** Size preset */
  size?: keyof typeof SIZE_MAP;
  /** Additional className */
  className?: string;
  /** Use rounded-xl instead of rounded-full */
  square?: boolean;
}

export function UserAvatar({
  src,
  name,
  size = 'md',
  className,
  square = false,
}: UserAvatarProps) {
  const [errored, setErrored] = useState(false);
  const sizeClass = SIZE_MAP[size];
  const px = PX_MAP[size];
  const radius = square ? 'rounded-xl' : 'rounded-full';

  const useFallback = !src || errored;

  if (useFallback) {
    return (
      <Image
        src={FALLBACK_LOGO}
        alt={name || 'MuhandesHub'}
        width={px}
        height={px}
        className={cn(sizeClass, radius, 'object-contain bg-primary/5 p-0.5', className)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={name || ''}
      width={px}
      height={px}
      className={cn(sizeClass, radius, 'object-cover', className)}
      onError={() => setErrored(true)}
    />
  );
}
