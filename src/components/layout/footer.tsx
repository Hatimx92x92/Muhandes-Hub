import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import { Logo } from '@/components/ui/logo';
import { getTranslations } from 'next-intl/server';

// =============================================================================
// Footer — corporate B2B footer with trust signals
// =============================================================================

const footerLinkKeys = {
  platform: [
    { href: '/projects', key: 'projects' },
    { href: '/marketplace', key: 'marketplace' },
    { href: '/partners', key: 'partners' },
    { href: '/pricing', key: 'pricing' },
  ],
  support: [
    { href: '/contact', key: 'contact' },
    { href: '/terms', key: 'terms' },
    { href: '/privacy', key: 'privacy' },
    { href: '/cookies', key: 'cookies' },
  ],
} as const;



export async function Footer({ className }: { className?: string }) {
  const t = await getTranslations();

  return (
    <footer
      className={cn(
        'relative border-t border-border bg-muted/30',
        className,
      )}
    >
      {/* Gradient top accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center group">
              <Logo size="md" />
            </Link>
            <p className="mt-4 max-w-md text-sm text-muted-foreground leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-4">{t('nav.platform')}</h3>
            <ul className="space-y-2.5">
              {footerLinkKeys.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    {t(`nav.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-4">{t('nav.support')}</h3>
            <ul className="space-y-2.5">
              {footerLinkKeys.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    {t(`nav.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">
            {t('common.copyright', { year: new Date().getFullYear() })}
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            {t('common.saudiVat')}
          </p>
        </div>
      </div>
    </footer>
  );
}
