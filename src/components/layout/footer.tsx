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
              <Logo size="md" subtitle={t('common.appTagline')} />
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
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/muhandeshub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="X (Twitter)"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
            <a
              href="https://linkedin.com/company/muhandeshub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            </a>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {t('common.saudiVat')}
          </p>
        </div>
      </div>
    </footer>
  );
}
