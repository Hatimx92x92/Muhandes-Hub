import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// Skeleton — premium shimmer loading placeholder
// =============================================================================

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-lg',
        className,
      )}
      style={{
        backgroundImage:
          'linear-gradient(90deg, var(--muted) 0%, var(--border) 40%, var(--muted) 80%)',
        backgroundSize: '200% 100%',
      }}
      {...props}
    />
  );
}
