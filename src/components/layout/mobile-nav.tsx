'use client';

import { useState, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { Menu, LayoutDashboard, User, Shield, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { logout } from '@/actions/auth';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';

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

  const close = useCallback(() => setIsOpen(false), []);

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger
          className="inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>

        <SheetContent side="left" showCloseButton>
          <SheetHeader>
            <SheetTitle className="text-lg font-bold">
              {tc('appName')}
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-1 p-4 pt-0">
            {links.map((link) => (
              <SheetClose
                key={link.href}
                render={<Link href={link.href} />}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
              >
                {link.label}
              </SheetClose>
            ))}
            <hr className="my-3 border-border" />

            {isAuthenticated ? (
              <>
                {userName && (
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground truncate">
                    {userName}
                  </div>
                )}
                <SheetClose
                  render={<Link href="/dashboard" />}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-all duration-200"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t('dashboard')}
                </SheetClose>
                {isAdmin && (
                  <SheetClose
                    render={<Link href="/admin" />}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-all duration-200"
                  >
                    <Shield className="h-4 w-4" />
                    {t('adminPanel')}
                  </SheetClose>
                )}
                <SheetClose
                  render={<Link href="/dashboard/profile" />}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                >
                  <User className="h-4 w-4" />
                  {t('profile')}
                </SheetClose>
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
                <SheetClose
                  render={<Link href="/login" />}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-all duration-200"
                >
                  {t('login')}
                </SheetClose>
                <SheetClose
                  render={<Link href="/register" />}
                  className="rounded-xl bg-linear-to-r from-primary to-primary-dark px-3 py-2.5 text-sm font-bold text-primary-foreground shadow-md text-center transition-all duration-200 hover:shadow-lg"
                >
                  {t('register')}
                </SheetClose>
              </>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
