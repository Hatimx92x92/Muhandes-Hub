'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Locale, BilingualText } from '@/types';

// =============================================================================
// useLocale hook — AR/EN switching, dir management, field helpers
// =============================================================================

function getInitialLocale(): Locale {
  if (typeof document !== 'undefined') {
    const lang = document.documentElement.lang;
    if (lang === 'en') return 'en';
  }
  return 'ar';
}

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  // Sync with document on mount (for SSR hydration)
  useEffect(() => {
    setLocaleState(getInitialLocale());
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    document.documentElement.lang = newLocale;
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    document.cookie = `locale=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  }, [locale, setLocale]);

  /** Pick the correct language field from bilingual content.
   *  Supports both `t({ ar, en })` and `t(ar, en)` signatures.
   */
  const t = useCallback(
    (textOrAr: BilingualText | string, en?: string): string => {
      if (typeof textOrAr === 'string') {
        return locale === 'ar' ? textOrAr : (en ?? textOrAr);
      }
      return locale === 'ar' ? textOrAr.ar : textOrAr.en;
    },
    [locale],
  );

  /** Pick the correct field value from two locale-specific values.
   *  Also works as a field name builder: `field('title')` → `'title_ar'`
   */
  const field = useCallback(
    (arValueOrBase: string | null | undefined, enValue?: string | null): string => {
      if (enValue !== undefined) {
        return (locale === 'ar' ? arValueOrBase : enValue) || '';
      }
      return `${arValueOrBase}_${locale}`;
    },
    [locale],
  );

  const isRTL = locale === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';

  return {
    locale,
    setLocale,
    toggleLocale,
    t,
    field,
    isRTL,
    dir,
  };
}
