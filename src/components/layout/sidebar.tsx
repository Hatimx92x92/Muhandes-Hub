'use client';

import { useState, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  Package,
  Handshake,
  FileText,
  MessageSquare,
  Bell,
  Star,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  Receipt,
  ShoppingCart,
  ClipboardList,
} from 'lucide-react';
import type { UserRole } from '@/types';

// =============================================================================
// Sidebar Navigation Items — role-based
// =============================================================================

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/dashboard/projects', labelKey: 'projects', icon: FolderKanban, roles: ['project_owner', 'contractor'] },
  { href: '/dashboard/products', labelKey: 'products', icon: Package, roles: ['supplier'] },
  { href: '/dashboard/deals', labelKey: 'deals', icon: Handshake },
  { href: '/dashboard/quotations', labelKey: 'quotations', icon: Receipt, roles: ['contractor', 'supplier'] },
  { href: '/dashboard/rfqs', labelKey: 'rfqs', icon: ShoppingCart },
  { href: '/dashboard/contracts', labelKey: 'contracts', icon: FileText, roles: ['project_owner', 'contractor', 'supplier'] },
  { href: '/dashboard/crm', labelKey: 'crm', icon: Users, roles: ['project_owner', 'contractor', 'supplier'] },
  { href: '/dashboard/messages', labelKey: 'messages', icon: MessageSquare },
  { href: '/dashboard/notifications', labelKey: 'notifications', icon: Bell },
  { href: '/dashboard/reviews', labelKey: 'reviews', icon: Star },
  { href: '/dashboard/analytics', labelKey: 'analytics', icon: BarChart3, roles: ['project_owner', 'contractor', 'supplier'] },
  { href: '/dashboard/commissions', labelKey: 'commissions', icon: ClipboardList, roles: ['contractor', 'supplier'] },
  { href: '/dashboard/settings', labelKey: 'settings', icon: Settings },
];

// =============================================================================
// Sidebar Component
// =============================================================================

interface SidebarProps {
  /** Current user role — used to filter nav items */
  userRole?: UserRole;
  /** Unread message count */
  messageCount?: number;
  /** Unread notification count */
  notificationCount?: number;
  className?: string;
}

export function Sidebar({ userRole, messageCount = 0, notificationCount = 0, className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const t = useTranslations('nav');

  const toggleCollapse = useCallback(() => setCollapsed((prev) => !prev), []);

  // Filter nav items by role
  const visibleItems = navItems.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole)),
  );

  return (
    <aside
      className={cn(
        'sticky top-16 flex h-[calc(100vh-4rem)] flex-col border-e border-sidebar-border bg-sidebar transition-all duration-300 ease-out',
        collapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            // Badge count for messages and notifications
            let badgeCount = 0;
            if (item.href === '/dashboard/messages') badgeCount = messageCount;
            if (item.href === '/dashboard/notifications') badgeCount = notificationCount;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground border-s-2 border-s-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                    collapsed && 'justify-center px-2',
                  )}
                  title={collapsed ? t(item.labelKey) : undefined}
                >
                  <span className="relative shrink-0">
                    <Icon className="h-5 w-5" />
                    {collapsed && badgeCount > 0 && (
                      <span className="absolute -top-1.5 -inset-e-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[8px] font-bold text-destructive-foreground animate-bounce-subtle">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1">{t(item.labelKey)}</span>
                      {badgeCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={toggleCollapse}
          className="flex w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={cn(
              'h-5 w-5 transition-transform rtl:rotate-180',
              collapsed && 'rotate-180 rtl:rotate-0',
            )}
          />
        </button>
      </div>

      {/* Settings link */}
      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/dashboard/profile"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors',
            collapsed && 'justify-center px-2',
          )}
          title={collapsed ? t('settings') : undefined}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t('settings')}</span>}
        </Link>
      </div>
    </aside>
  );
}
