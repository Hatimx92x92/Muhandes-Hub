'use client';

import { useLocale } from 'next-intl';
import { formatDate } from '@/lib/utils';

interface LocaleDateProps {
  date: string | Date | null | undefined;
  fallback?: string;
  className?: string;
  options?: Intl.DateTimeFormatOptions;
}

/**
 * Renders a date string using the current locale, preventing SSR/client hydration mismatches.
 */
export function LocaleDate({ date, fallback = '—', className, options }: LocaleDateProps) {
  const locale = useLocale();
  if (!date) return <span className={className}>{fallback}</span>;
  return <span className={className}>{formatDate(date, locale, options)}</span>;
}
