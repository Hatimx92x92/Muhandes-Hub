'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useState, useCallback, useRef, useEffect } from 'react';
import { logout } from '@/actions/auth';
import {
  User,
  LogOut,
  ChevronDown,
  Shield,
  LayoutDashboard,
  CreditCard,
} from 'lucide-react';

// =============================================================================
// HeaderUserMenu — authenticated user dropdown for the main Header
// =============================================================================

interface HeaderUserMenuProps {
  userName: string;
  userAvatar?: string;
  isAdmin?: boolean;
}

export function HeaderUserMenu({
  userName,
  isAdmin = false,
}: HeaderUserMenuProps) {
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
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              {t('dashboard')}
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <Shield className="h-4 w-4" />
                {t('adminPanel')}
              </Link>
            )}
            <hr className="my-1 border-border" />
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
              <CreditCard className="h-4 w-4" />
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
  );
}
