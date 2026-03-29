// =============================================================================
// Dual Progress Component — Seller + Buyer progress bars
// =============================================================================

'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface DualProgressProps {
  sellerProgress: number;
  buyerProgress: number;
  sellerLabel?: string;
  buyerLabel?: string;
  className?: string;
}

export function DualProgress({ sellerProgress, buyerProgress, sellerLabel, buyerLabel, className }: DualProgressProps) {
  const t = useTranslations('features.dualProgress');
  return (
    <Card className={cn('p-5', className)}>
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Seller Progress */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{t('sellerProgress')}</span>
            <span className="text-sm font-bold text-primary">{sellerProgress}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                sellerProgress >= 100
                  ? 'bg-success'
                  : sellerProgress >= 50
                    ? 'bg-primary'
                    : 'bg-primary/70',
              )}
              style={{ width: `${Math.min(100, sellerProgress)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('sellerDescription')}
          </p>
        </div>

        {/* Buyer Progress */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{t('buyerProgress')}</span>
            <span className="text-sm font-bold text-success">{buyerProgress}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                buyerProgress >= 100
                  ? 'bg-success'
                  : buyerProgress >= 50
                    ? 'bg-success/80'
                    : 'bg-success/60',
              )}
              style={{ width: `${Math.min(100, buyerProgress)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('buyerDescription')}
          </p>
        </div>
      </div>

      {/* Combined completion indicator */}
      {sellerProgress >= 100 && buyerProgress >= 100 && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">
          <CheckCircle className="h-4 w-4" />
          {t('dealCompleted')}
        </div>
      )}
    </Card>
  );
}
