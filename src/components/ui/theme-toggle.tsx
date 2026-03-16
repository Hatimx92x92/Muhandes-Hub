'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useTheme } from './theme-provider';

// =============================================================================
// ThemeToggle — cycles light → dark → system
// =============================================================================

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolved } = useTheme();
  const t = useTranslations('theme');

  const cycle = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  const label = t(theme === 'light' ? 'light' : theme === 'dark' ? 'dark' : 'system');

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <button
      type="button"
      onClick={cycle}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium',
        'text-foreground hover:bg-muted transition-colors',
        className,
      )}
      aria-label={t('ariaLabel', { mode: label })}
      title={label}
    >
      <Icon className={cn('h-4 w-4 transition-transform duration-300', resolved === 'dark' && 'rotate-180')} />
    </button>
  );
}
