'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { Calendar } from 'lucide-react';

const PERIODS = ['7d', '30d', '90d', '12m', 'all'] as const;

interface AnalyticsPeriodFilterProps {
  currentPeriod: string;
}

export function AnalyticsPeriodFilter({ currentPeriod }: AnalyticsPeriodFilterProps) {
  const t = useTranslations('dashboard.analytics');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePeriodChange = (period: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', period);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
      <Calendar className="ms-1.5 h-3.5 w-3.5 text-muted-foreground" />
      {PERIODS.map((period) => (
        <button
          key={period}
          onClick={() => handlePeriodChange(period)}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
            currentPeriod === period
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t(`period.${period}` as never)}
        </button>
      ))}
    </div>
  );
}
