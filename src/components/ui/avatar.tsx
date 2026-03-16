import { cn } from '@/lib/utils';

export interface AvatarProps {
  /** Image source URL */
  src?: string | null;
  /** Display name for alt text and fallback initials */
  name?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show colored ring (e.g., online status) */
  ring?: 'primary' | 'success' | 'warning' | 'destructive';
  className?: string;
}

const sizeStyles = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-lg',
} as const;

const ringStyles = {
  primary: 'ring-2 ring-primary ring-offset-2 ring-offset-background',
  success: 'ring-2 ring-success ring-offset-2 ring-offset-background',
  warning: 'ring-2 ring-warning ring-offset-2 ring-offset-background',
  destructive: 'ring-2 ring-destructive ring-offset-2 ring-offset-background',
} as const;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ src, name, size = 'md', ring, className }: AvatarProps) {
  const initials = name ? getInitials(name) : '?';

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-primary/10 font-semibold text-primary',
        sizeStyles[size],
        ring && ringStyles[ring],
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
