// =============================================================================
// Muqawil HUB — Locale Toggle Button
// Switches between Arabic (RTL) and English (LTR)
// =============================================================================

'use client';

import { Languages } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocale } from '@/hooks';
import { cn } from '@/lib/utils';

interface LocaleToggleProps {
  className?: string;
}

export function LocaleToggle({ className }: LocaleToggleProps) {
  const { locale, toggleLocale } = useLocale();
  const t = useTranslations('locale');

  return (
    <button
      onClick={toggleLocale}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold',
        'rounded-lg border border-border',
        'text-muted-foreground',
        'hover:bg-muted hover:text-foreground',
        'transition-all duration-200',
        className,
      )}
      aria-label={locale === 'ar' ? t('switchToEn') : t('switchToAr')}
    >
      <Languages size={16} />
      <span>{locale === 'ar' ? t('en') : t('ar')}</span>
    </button>
  );
}
