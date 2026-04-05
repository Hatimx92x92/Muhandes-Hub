'use client';

import { useState, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  Handshake,
  Banknote,
  CreditCard,
  Star,
  Settings,
  ClipboardList,
  BarChart3,
  Inbox,
  MessageSquare,
  ChevronLeft,
  ChevronDown,
} from 'lucide-react';

// =============================================================================
// Admin Navigation — grouped
// =============================================================================

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
}

interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

const ADMIN_GROUPS: NavGroup[] = [
  {
    labelKey: 'groupOverview',
    items: [
      { href: '/admin', labelKey: 'dashboard', icon: LayoutDashboard },
      { href: '/admin/analytics', labelKey: 'analytics', icon: BarChart3 },
    ],
  },
  {
    labelKey: 'groupContent',
    items: [
      { href: '/admin/users', labelKey: 'users', icon: Users },
      { href: '/admin/registrations', labelKey: 'registrations', icon: UserPlus },
      { href: '/admin/posts', labelKey: 'posts', icon: FileText },
      { href: '/admin/reviews', labelKey: 'reviews', icon: Star },
    ],
  },
  {
    labelKey: 'groupFinance',
    items: [
      { href: '/admin/deals', labelKey: 'deals', icon: Handshake },
      { href: '/admin/commissions', labelKey: 'commissions', icon: Banknote },
      { href: '/admin/subscriptions', labelKey: 'subscriptions', icon: CreditCard },
    ],
  },
  {
    labelKey: 'groupSystem',
    items: [
      { href: '/admin/contacts', labelKey: 'contacts', icon: Inbox },
      { href: '/admin/messages', labelKey: 'messages', icon: MessageSquare },
      { href: '/admin/settings', labelKey: 'settings', icon: Settings },
      { href: '/admin/audit-log', labelKey: 'auditLog', icon: ClipboardList },
    ],
  },
];

// =============================================================================
// AdminSidebar Component
// =============================================================================

interface AdminSidebarProps {
  adminName: string;
  className?: string;
}

export function AdminSidebar({ adminName, className }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('admin.nav');
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleCollapse = useCallback(() => setCollapsed((prev) => !prev), []);

  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-e border-border bg-card lg:flex transition-all duration-300 ease-out',
        collapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center border-b border-border px-4">
        {!collapsed && (
          <Link href="/admin" className="text-lg font-bold text-primary truncate">
            {t('adminPanel')}
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-2">
          {ADMIN_GROUPS.map((group) => {
            const isGroupCollapsed = collapsedGroups[group.labelKey] ?? false;
            const hasActiveItem = group.items.some(
              (item) =>
                pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href)),
            );

            return (
              <div key={group.labelKey}>
                {/* Group header — hidden when sidebar collapsed */}
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.labelKey)}
                    className={cn(
                      'flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors rounded-md',
                      hasActiveItem
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <span>{t(group.labelKey)}</span>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 transition-transform duration-200',
                        isGroupCollapsed && '-rotate-90 rtl:rotate-90',
                      )}
                    />
                  </button>
                )}

                {/* Group items */}
                {(!isGroupCollapsed || collapsed) && (
                  <ul className="flex flex-col gap-0.5 mt-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        pathname === item.href ||
                        (item.href !== '/admin' && pathname.startsWith(item.href));

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                              isActive
                                ? 'bg-primary/10 text-primary border-s-2 border-s-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                              collapsed && 'justify-center px-2',
                            )}
                            title={collapsed ? t(item.labelKey) : undefined}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span>{t(item.labelKey)}</span>}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer — admin name + collapse toggle */}
      <div className="border-t border-border p-3">
        {!collapsed && (
          <div className="mb-2 px-3">
            <p className="truncate text-sm font-medium">{adminName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('adminPanel')}</p>
          </div>
        )}
        <button
          type="button"
          onClick={toggleCollapse}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
    </aside>
  );
}
