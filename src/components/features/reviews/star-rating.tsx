'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface StarRatingProps {
  name: string;
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function StarRating({
  name,
  value,
  onChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const t = useTranslations('features.starRating');
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-colors',
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
          )}
          aria-label={t('stars', { count: star })}
        >
          <svg
            className={cn(
              sizeClasses[size],
              star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-muted-foreground/40',
            )}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
          <input
            type="hidden"
            name={name}
            value={value}
          />
        </button>
      ))}
    </div>
  );
}
