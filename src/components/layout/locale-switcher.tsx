'use client';

import { usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';
import type { Locale } from '@/i18n/routing';

// =============================================================================
// LocaleSwitcher — AR/EN toggle via URL-based routing
// Props-driven to avoid client-side intl context dependency.
// =============================================================================

interface LocaleSwitcherProps {
  className?: string;
  locale: Locale;
  label: string;
  ariaLabel: string;
}

export function LocaleSwitcher({ className, locale, label, ariaLabel }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

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
      aria-label={ariaLabel}
    >
      <Globe className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
