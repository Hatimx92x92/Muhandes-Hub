import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  /** Current value (0–max) */
  value: number;
  /** Maximum value */
  max?: number;
  /** Color variant */
  variant?: 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'secondary';
  /** Show percentage label */
  showLabel?: boolean;
  /** Animate the fill on mount */
  animated?: boolean;
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-info',
  secondary: 'bg-secondary',
} as const;

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
} as const;

export function ProgressBar({
  value,
  max = 100,
  variant = 'primary',
  showLabel = false,
  animated = true,
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>{Math.round(percentage)}%</span>
          <span>{value} / {max}</span>
        </div>
      )}
      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-muted',
          sizeStyles[size],
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            'h-full rounded-full',
            variantStyles[variant],
            animated && 'transition-all duration-700 ease-out',
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
