'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';

/**
 * Syncs the <html> element's `dir` and `lang` attributes with the current
 * next-intl locale on every client-side navigation. The root layout is a
 * server component that only renders once per hard navigation, so soft
 * navigations (locale switch) need this client-side sync.
 */
export function DocumentDirection() {
  const locale = useLocale();

  useEffect(() => {
    const dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  return null;
}
