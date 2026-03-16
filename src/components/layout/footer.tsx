import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Shield, Award, Globe2 } from 'lucide-react';
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

const trustSignalKeys = [
  { icon: Shield, key: 'pdpl' as const },
  { icon: Award, key: 'zatca' as const },
  { icon: Globe2, key: 'bilingual' as const },
];

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
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Trust signals bar */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {trustSignalKeys.map((signal) => {
              const Icon = signal.icon;
              return (
                <div key={signal.key} className="flex items-center gap-2.5 text-muted-foreground">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold">{t(`trust.${signal.key}`)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
