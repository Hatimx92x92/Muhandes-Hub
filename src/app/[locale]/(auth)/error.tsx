'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  useEffect(() => {
    console.error('Auth error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">{t('title')}</h2>
        <p className="mt-2 text-muted-foreground">{t('authError')}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="primary" onClick={reset}>
            {t('retry')}
          </Button>
          <Link href="/">
            <Button variant="outline">{t('home')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
