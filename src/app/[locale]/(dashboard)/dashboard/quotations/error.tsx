'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export default function QuotationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Quotations error:', error);
  }, [error]);

  const t = useTranslations('dashboard.error');

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">{t('title')}</h2>
        <p className="mt-2 text-muted-foreground">{t('description')}</p>
        {error.digest && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t('errorCode')} {error.digest}
          </p>
        )}
        <Button variant="primary" className="mt-6" onClick={reset}>
          {t('retry')}
        </Button>
      </div>
    </div>
  );
}
