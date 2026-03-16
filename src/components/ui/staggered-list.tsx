'use client';

import { Children, type ReactNode } from 'react';
import { ScrollReveal } from './scroll-reveal';
import { cn } from '@/lib/utils';

export interface StaggeredListProps {
  children: ReactNode;
  /** Delay between each child in ms */
  staggerMs?: number;
  /** Base delay before first child animates */
  baseDelay?: number;
  /** Animation direction */
  direction?: 'up' | 'down' | 'start' | 'end';
  className?: string;
}

export function StaggeredList({
  children,
  staggerMs = 80,
  baseDelay = 0,
  direction = 'up',
  className,
}: StaggeredListProps) {
  const items = Children.toArray(children);

  return (
    <div className={cn(className)}>
      {items.map((child, index) => (
        <ScrollReveal
          key={index}
          direction={direction}
          delay={baseDelay + index * staggerMs}
        >
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}
