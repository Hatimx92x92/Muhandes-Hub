'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ScrollRevealProps {
  children: ReactNode;
  /** Animation direction */
  direction?: 'up' | 'down' | 'start' | 'end';
  /** Delay in ms */
  delay?: number;
  /** Duration override */
  duration?: string;
  /** IntersectionObserver threshold */
  threshold?: number;
  className?: string;
  /** Use 'once' to animate only once */
  once?: boolean;
}

const directionClass = {
  up: 'animate-fade-up',
  down: 'animate-fade-down',
  start: 'animate-slide-in-start',
  end: 'animate-slide-in-end',
} as const;

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration,
  threshold = 0.15,
  className,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  return (
    <div
      ref={ref}
      className={cn(
        isVisible ? directionClass[direction] : 'opacity-0',
        className,
      )}
      style={{
        animationDelay: delay ? `${delay}ms` : undefined,
        animationDuration: duration || undefined,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}
