'use client';

import { NumberTicker } from '@/components/ui/number-ticker';

interface AdminStatValueProps {
  value: number | string;
}

export function AdminStatValue({ value }: AdminStatValueProps) {
  if (typeof value === 'string') {
    // For formatted strings like "1,234 SAR" — extract numeric part
    const numericMatch = value.match(/[\d,]+/);
    if (numericMatch) {
      const num = Number(numericMatch[0].replace(/,/g, ''));
      const suffix = value.replace(numericMatch[0], '').trim();
      if (!isNaN(num) && num > 0) {
        return (
          <span>
            <NumberTicker value={num} />
            {suffix && ` ${suffix}`}
          </span>
        );
      }
    }
    return <span>{value}</span>;
  }

  if (value === 0) return <span>0</span>;

  return <NumberTicker value={value} />;
}
