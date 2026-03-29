'use client';

import { useState, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Menu, X, LayoutDashboard, User, Shield, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { logout } from '@/actions/auth';

// =============================================================================
// MobileNav — responsive hamburger navigation (auth-aware)
// =============================================================================

interface NavLink {
  href: string;
  label: string;
}

interface MobileNavProps {
  links: NavLink[];
  isAuthenticated?: boolean;
  userName?: string;
  isAdmin?: boolean;
}

export function MobileNav({
  links,
  isAuthenticated = false,
  userName,
  isAdmin = false,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('nav');
  const tc = useTranslations('common');

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
                {tc('appName')}
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

              {isAuthenticated ? (
                <>
                  {/* Authenticated user info */}
                  {userName && (
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground truncate">
                      {userName}
                    </div>
                  )}
                  <Link
                    href="/dashboard"
                    onClick={close}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-all duration-200"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {t('dashboard')}
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={close}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-all duration-200"
                    >
                      <Shield className="h-4 w-4" />
                      {t('adminPanel')}
                    </Link>
                  )}
                  <Link
                    href="/dashboard/profile"
                    onClick={close}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                  >
                    <User className="h-4 w-4" />
                    {t('profile')}
                  </Link>
                  <hr className="my-2 border-border" />
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      logout();
                    }}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('logout')}
                  </button>
                </>
              ) : (
                <>
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
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
