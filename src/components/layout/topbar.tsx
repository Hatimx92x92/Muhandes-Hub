'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { logout } from '@/actions/auth';
import { Bell, User, LogOut, ChevronDown, Shield } from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { LocaleSwitcher } from './locale-switcher';

// =============================================================================
// Topbar — dashboard top navigation bar
// =============================================================================

interface TopbarProps {
  /** User display name */
  userName?: string;
  /** User avatar URL */
  userAvatar?: string;
  /** Unread notification count */
  notificationCount?: number;
  /** Whether user is admin */
  isAdmin?: boolean;
  className?: string;
}

export function Topbar({
  userName,
  notificationCount = 0,
  isAdmin = false,
  className,
}: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('nav');

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6',
        className,
      )}
    >
      {/* Breadcrumbs placeholder */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xs">
            M
          </div>
          <span className="text-sm font-semibold text-foreground hidden sm:block">
            Muhaned Hub
          </span>
        </Link>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <LocaleSwitcher />

        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className="relative inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -inset-e-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-bounce-subtle">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </Link>

        {/* User menu */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={toggleMenu}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <span className="hidden sm:block text-sm font-medium text-foreground max-w-30 truncate">
              {userName}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute inset-e-0 top-full mt-1.5 w-48 rounded-xl border border-border bg-card shadow-xl z-50 animate-scale-in">
              <div className="p-1.5">
                {isAdmin && (
                  <>
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Shield className="h-4 w-4" />
                      {t('adminPanel')}
                    </Link>
                    <hr className="my-1 border-border" />
                  </>
                )}
                <Link
                  href="/dashboard/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <User className="h-4 w-4" />
                  {t('profile')}
                </Link>
                <Link
                  href="/dashboard/subscription"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <ChevronDown className="h-4 w-4" />
                  {t('subscription')}
                </Link>
                <hr className="my-1 border-border" />
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  {t('logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
