import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// Card Container
// =============================================================================

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Adds hover lift & shadow effect for clickable cards */
  interactive?: boolean;
  /** Adds a colored accent bar on the start edge */
  highlight?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info';
}

const highlightStyles = {
  primary: 'border-s-4 border-s-primary',
  secondary: 'border-s-4 border-s-secondary',
  success: 'border-s-4 border-s-success',
  warning: 'border-s-4 border-s-warning',
  destructive: 'border-s-4 border-s-destructive',
  info: 'border-s-4 border-s-info',
} as const;

export function Card({ className, children, interactive, highlight, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card text-card-foreground shadow-sm',
        'transition-all duration-200 ease-out',
        interactive && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30',
        highlight && highlightStyles[highlight],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Card Header
// =============================================================================

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn('flex flex-col gap-1.5 p-6 pb-0', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Card Title
// =============================================================================

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

// =============================================================================
// Card Description
// =============================================================================

export function CardDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    >
      {children}
    </p>
  );
}

// =============================================================================
// Card Content
// =============================================================================

export function CardContent({ className, children, ...props }: Omit<CardProps, 'interactive' | 'highlight'>) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

// =============================================================================
// Card Footer
// =============================================================================

export function CardFooter({ className, children, ...props }: Omit<CardProps, 'interactive' | 'highlight'>) {
  return (
    <div
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  );
}
