'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Calendar } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PERIODS = ['7d', '30d', '90d', '12m', 'all'] as const;

interface AnalyticsPeriodFilterProps {
  currentPeriod: string;
}

export function AnalyticsPeriodFilter({ currentPeriod }: AnalyticsPeriodFilterProps) {
  const t = useTranslations('dashboard.analytics');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePeriodChange = (value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', String(value));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs value={currentPeriod} onValueChange={handlePeriodChange}>
      <TabsList className="h-auto">
        <Calendar className="ms-1.5 h-3.5 w-3.5 text-muted-foreground" />
        {PERIODS.map((period) => (
          <TabsTrigger key={period} value={period} className="px-3 py-1.5 text-xs">
            {t(`period.${period}` as never)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
