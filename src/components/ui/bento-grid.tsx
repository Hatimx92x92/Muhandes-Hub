'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';

/* ==========================================================================
   BentoGrid — Asymmetric grid layout for dashboard-style card previews
   ========================================================================== */

interface BentoGridProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}

export function BentoGrid({
  children,
  className,
  stagger = 0.12,
  delay = 0,
}: BentoGridProps) {
  return (
    <StaggerContainer
      stagger={stagger}
      delay={delay}
      className={cn(
        'grid auto-rows-[minmax(100px,1fr)] gap-3',
        'grid-cols-2 sm:grid-cols-3',
        className,
      )}
    >
      {children}
    </StaggerContainer>
  );
}

/* --------------------------------------------------------------------------
   BentoCell — Individual cell with span control, wraps content in a card
   -------------------------------------------------------------------------- */

interface BentoCellProps {
  children: ReactNode;
  colSpan?: 1 | 2;
  rowSpan?: 1 | 2;
  className?: string;
}

export function BentoCell({
  children,
  colSpan = 1,
  rowSpan = 1,
  className,
}: BentoCellProps) {
  return (
    <StaggerItem
      className={cn(
        colSpan === 2 && 'col-span-2',
        rowSpan === 2 && 'row-span-2',
        className,
      )}
    >
      {children}
    </StaggerItem>
  );
}
