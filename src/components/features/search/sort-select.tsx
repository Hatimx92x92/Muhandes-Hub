'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface SortOption {
  value: string;
  label: string;
}

interface SortSelectProps {
  value: string;
  onChange: (value: string) => void;
  options?: SortOption[];
  className?: string;
}

export function SortSelect({
  value,
  onChange,
  options,
  className,
}: SortSelectProps) {
  const t = useTranslations('features.sortSelect');

  const defaultOptions: SortOption[] = [
    { value: 'created_at:desc', label: t('mostRecent') },
    { value: 'created_at:asc', label: t('oldest') },
    { value: 'average_rating:desc', label: t('highestRated') },
    { value: 'price:asc', label: t('priceLowToHigh') },
    { value: 'price:desc', label: t('priceHighToLow') },
    { value: 'bid_count:desc', label: t('mostBids') },
  ];

  const effectiveOptions = options ?? defaultOptions;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'rounded-md border border-border bg-background px-3 py-2 text-sm',
        className,
      )}
    >
      {effectiveOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
