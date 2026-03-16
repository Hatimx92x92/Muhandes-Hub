'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin error:', error);
  }, [error]);

  const t = useTranslations('admin.error');

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">{t('title')}</h2>
        <p className="mt-2 text-muted-foreground">
          {t('description')}
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t('errorCode')} {error.digest}
          </p>
        )}
        <Button
          variant="primary"
          className="mt-6"
          onClick={reset}
        >
          {t('retry')}
        </Button>
      </div>
    </div>
  );
}
