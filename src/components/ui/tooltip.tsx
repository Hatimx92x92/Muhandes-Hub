import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  children: ReactNode;
  /** Tooltip text */
  content: string;
  /** Placement relative to trigger */
  side?: 'top' | 'bottom' | 'start' | 'end';
  className?: string;
}

const sideStyles = {
  top: 'bottom-full mb-2 start-1/2 -translate-x-1/2',
  bottom: 'top-full mt-2 start-1/2 -translate-x-1/2',
  start: 'end-full me-2 top-1/2 -translate-y-1/2',
  end: 'start-full ms-2 top-1/2 -translate-y-1/2',
} as const;

export function Tooltip({
  children,
  content,
  side = 'top',
  className,
}: TooltipProps) {
  return (
    <div className={cn('group relative inline-flex', className)}>
      {children}
      <div
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap',
          'rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background',
          'opacity-0 transition-opacity duration-200 group-hover:opacity-100',
          'shadow-lg',
          sideStyles[side],
        )}
      >
        {content}
      </div>
    </div>
  );
}
