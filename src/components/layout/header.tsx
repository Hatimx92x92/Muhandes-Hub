import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { LocaleSwitcher } from './locale-switcher';
import { MobileNav } from './mobile-nav';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { getTranslations } from 'next-intl/server';

// =============================================================================
// Header — public pages navigation (corporate B2B)
// =============================================================================

const navLinkKeys = [
  { href: '/projects', key: 'projects' },
  { href: '/marketplace', key: 'marketplace' },
  { href: '/rfqs', key: 'rfqs' },
  { href: '/partners', key: 'partners' },
  { href: '/pricing', key: 'pricing' },
] as const;

export async function Header({ className }: { className?: string }) {
  const t = await getTranslations('nav');

  const navLinks = navLinkKeys.map((link) => ({
    href: link.href,
    label: t(link.key),
  }));

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-border/60',
        'bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60',
        'transition-all duration-300',
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Logo size="md" showText className="hidden sm:flex" />
          <Logo size="sm" showText={false} className="sm:hidden" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative rounded-lg px-3.5 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-all duration-200"
          >
            {t('login')}
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
          >
            {t('register')}
          </Link>
          <MobileNav links={navLinks} />
        </div>
      </div>
    </header>
  );
}
