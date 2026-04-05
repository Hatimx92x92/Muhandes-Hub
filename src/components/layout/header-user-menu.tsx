'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { logout } from '@/actions/auth';
import {
  User,
  LogOut,
  ChevronDown,
  Shield,
  LayoutDashboard,
  CreditCard,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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
  const t = useTranslations('nav');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition-colors outline-none">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="h-4 w-4" />
        </div>
        <span className="hidden sm:block text-sm font-medium text-foreground max-w-30 truncate">
          {userName}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={6} className="w-48">
        <DropdownMenuItem render={<Link href="/dashboard" />}>
          <LayoutDashboard className="h-4 w-4" />
          {t('dashboard')}
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem render={<Link href="/admin" />}>
            <Shield className="h-4 w-4" />
            {t('adminPanel')}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/dashboard/profile" />}>
          <User className="h-4 w-4" />
          {t('profile')}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/dashboard/subscription" />}>
          <CreditCard className="h-4 w-4" />
          {t('subscription')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => logout()}>
          <LogOut className="h-4 w-4" />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
