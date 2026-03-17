'use client';

import { useState, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

// =============================================================================
// MobileNav — responsive hamburger navigation
// =============================================================================

interface NavLink {
  href: string;
  label: string;
}

export function MobileNav({ links }: { links: NavLink[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('nav');

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <div className="md:hidden">
      {/* Trigger */}
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted transition-colors"
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile menu panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />
          {/* Panel */}
          <div
            className={cn(
              'fixed inset-y-0 inset-s-0 z-50 w-72 bg-background border-e border-border shadow-2xl',
              'animate-slide-in-start',
            )}
          >
            <div className="flex h-16 items-center justify-between px-4 border-b border-border">
              <span className="text-lg font-bold text-foreground">
                Muhaned Hub
              </span>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4">
              {links.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                  style={{ animationDelay: `${(i + 1) * 60}ms` }}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-3 border-border" />
              <Link
                href="/login"
                onClick={close}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-all duration-200"
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                onClick={close}
                className="rounded-xl bg-linear-to-r from-primary to-primary-dark px-3 py-2.5 text-sm font-bold text-primary-foreground shadow-md text-center transition-all duration-200 hover:shadow-lg"
              >
                {t('register')}
              </Link>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
