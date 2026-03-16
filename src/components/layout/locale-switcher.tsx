'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';
import type { Locale } from '@/i18n/routing';

// =============================================================================
// LocaleSwitcher — AR/EN toggle via URL-based routing
// =============================================================================

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('locale');

  const targetLocale: Locale = locale === 'ar' ? 'en' : 'ar';

  function switchLocale() {
    router.replace(pathname, { locale: targetLocale });
  }

  return (
    <button
      type="button"
      onClick={switchLocale}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium',
        'text-foreground hover:bg-muted transition-colors',
        className,
      )}
      aria-label={locale === 'ar' ? t('switchToEn') : t('switchToAr')}
    >
      <Globe className="h-4 w-4" />
      <span>{locale === 'ar' ? t('en') : t('ar')}</span>
    </button>
  );
}
