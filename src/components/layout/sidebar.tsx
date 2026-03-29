'use client';

import { useState, useCallback, useMemo } from 'react';
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
  ExternalLink,
  Inbox,
  CreditCard,
  Gavel,
} from 'lucide-react';
import type { UserRole } from '@/types';

// =============================================================================
// Sidebar Navigation Items — role-based, grouped
// =============================================================================

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

/** All possible nav items — role filtering applied at render time */
const ALL_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/dashboard/projects', labelKey: 'projects', icon: FolderKanban, roles: ['project_owner', 'contractor'] },
  { href: '/dashboard/bids', labelKey: 'myBids', icon: Gavel, roles: ['contractor'] },
  { href: '/dashboard/products', labelKey: 'products', icon: Package, roles: ['supplier'] },
  { href: '/dashboard/deals', labelKey: 'deals', icon: Handshake },
  { href: '/dashboard/quotations', labelKey: 'quotations', icon: Receipt, roles: ['contractor', 'supplier'] },
  { href: '/dashboard/rfqs', labelKey: 'rfqs', icon: ShoppingCart },
  { href: '/dashboard/contracts', labelKey: 'contracts', icon: FileText, roles: ['project_owner', 'contractor', 'supplier'] },
  { href: '/dashboard/inquiries', labelKey: 'inquiries', icon: Inbox, roles: ['supplier'] },
  { href: '/dashboard/crm', labelKey: 'crm', icon: Users, roles: ['project_owner', 'contractor', 'supplier'] },
  { href: '/dashboard/messages', labelKey: 'messages', icon: MessageSquare },
  { href: '/dashboard/notifications', labelKey: 'notifications', icon: Bell },
  { href: '/dashboard/reviews', labelKey: 'reviews', icon: Star },
  { href: '/dashboard/analytics', labelKey: 'analytics', icon: BarChart3, roles: ['project_owner', 'contractor', 'supplier'] },
  { href: '/dashboard/commissions', labelKey: 'commissions', icon: ClipboardList, roles: ['contractor', 'supplier'] },
  { href: '/dashboard/payments', labelKey: 'payments', icon: CreditCard },
  { href: '/dashboard/settings', labelKey: 'settings', icon: Settings },
];

/** Lookup helper */
const itemByHref = (href: string) => ALL_NAV_ITEMS.find((i) => i.href === href)!;

// ---------------------------------------------------------------------------
// Role-aware sidebar group definitions
// Each role gets contextually labelled sections with relevant nav items.
// ---------------------------------------------------------------------------
interface NavGroup {
  labelKey: string;          // translation key under "nav"
  items: NavItem[];
}

const ROLE_GROUPS: Record<UserRole, NavGroup[]> = {
  project_owner: [
    { labelKey: 'groupOverview', items: [itemByHref('/dashboard')] },
    {
      labelKey: 'groupProjectManagement',
      items: [
        itemByHref('/dashboard/projects'),
        itemByHref('/dashboard/deals'),
        itemByHref('/dashboard/rfqs'),
        itemByHref('/dashboard/contracts'),
      ],
    },
    { labelKey: 'groupCommunication', items: [itemByHref('/dashboard/messages'), itemByHref('/dashboard/notifications')] },
    {
      labelKey: 'groupBusiness',
      items: [
        itemByHref('/dashboard/crm'),
        itemByHref('/dashboard/reviews'),
        itemByHref('/dashboard/analytics'),
      ],
    },
    { labelKey: 'groupAccount', items: [itemByHref('/dashboard/payments'), itemByHref('/dashboard/settings')] },
  ],
  contractor: [
    { labelKey: 'groupOverview', items: [itemByHref('/dashboard')] },
    {
      labelKey: 'groupProjectsBidding',
      items: [
        itemByHref('/dashboard/projects'),
        itemByHref('/dashboard/bids'),
        itemByHref('/dashboard/deals'),
        itemByHref('/dashboard/quotations'),
        itemByHref('/dashboard/rfqs'),
        itemByHref('/dashboard/contracts'),
      ],
    },
    { labelKey: 'groupCommunication', items: [itemByHref('/dashboard/messages'), itemByHref('/dashboard/notifications')] },
    {
      labelKey: 'groupBusiness',
      items: [
        itemByHref('/dashboard/crm'),
        itemByHref('/dashboard/reviews'),
        itemByHref('/dashboard/analytics'),
        itemByHref('/dashboard/commissions'),
      ],
    },
    { labelKey: 'groupAccount', items: [itemByHref('/dashboard/payments'), itemByHref('/dashboard/settings')] },
  ],
  supplier: [
    { labelKey: 'groupOverview', items: [itemByHref('/dashboard')] },
    {
      labelKey: 'groupProductsSales',
      items: [
        itemByHref('/dashboard/products'),
        itemByHref('/dashboard/inquiries'),
        itemByHref('/dashboard/deals'),
        itemByHref('/dashboard/quotations'),
        itemByHref('/dashboard/rfqs'),
        itemByHref('/dashboard/contracts'),
      ],
    },
    { labelKey: 'groupCommunication', items: [itemByHref('/dashboard/messages'), itemByHref('/dashboard/notifications')] },
    {
      labelKey: 'groupBusiness',
      items: [
        itemByHref('/dashboard/crm'),
        itemByHref('/dashboard/reviews'),
        itemByHref('/dashboard/analytics'),
        itemByHref('/dashboard/commissions'),
      ],
    },
    { labelKey: 'groupAccount', items: [itemByHref('/dashboard/payments'), itemByHref('/dashboard/settings')] },
  ],
  buyer: [
    { labelKey: 'groupOverview', items: [itemByHref('/dashboard')] },
    {
      labelKey: 'groupProcurement',
      items: [
        itemByHref('/dashboard/deals'),
        itemByHref('/dashboard/rfqs'),
      ],
    },
    { labelKey: 'groupCommunication', items: [itemByHref('/dashboard/messages'), itemByHref('/dashboard/notifications')] },
    {
      labelKey: 'groupBusiness',
      items: [itemByHref('/dashboard/reviews')],
    },
    { labelKey: 'groupAccount', items: [itemByHref('/dashboard/payments'), itemByHref('/dashboard/settings')] },
  ],
};

/** Fallback when role is unknown — flat list, all items */
const DEFAULT_GROUPS: NavGroup[] = [
  { labelKey: 'groupOverview', items: ALL_NAV_ITEMS },
];

// =============================================================================
// Sidebar Component
// =============================================================================

interface SidebarProps {
  userRole?: UserRole;
  /** Slug for the user's public partner profile (contractor/supplier only) */
  profileSlug?: string | null;
  messageCount?: number;
  notificationCount?: number;
  className?: string;
}

export function Sidebar({
  userRole,
  profileSlug,
  messageCount = 0,
  notificationCount = 0,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const t = useTranslations('nav');

  const toggleCollapse = useCallback(() => setCollapsed((prev) => !prev), []);

  // Build role-aware groups, filtering out items the user can't see
  const groups = useMemo(() => {
    const src = userRole ? (ROLE_GROUPS[userRole] ?? DEFAULT_GROUPS) : DEFAULT_GROUPS;
    return src
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (item) => !item.roles || (userRole && item.roles.includes(userRole)),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [userRole]);

  // Whether this role has a public partner profile
  const showPublicProfile =
    profileSlug && (userRole === 'contractor' || userRole === 'supplier');

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
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div key={group.labelKey}>
              {/* Group label — hidden when collapsed */}
              {!collapsed && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  {t(group.labelKey)}
                </p>
              )}
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <SidebarItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    collapsed={collapsed}
                    messageCount={messageCount}
                    notificationCount={notificationCount}
                    t={t}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Public profile link (contractor/supplier only) */}
      {showPublicProfile && (
        <div className="border-t border-sidebar-border px-3 py-2">
          <Link
            href={`/partners/${profileSlug}`}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors',
              collapsed && 'justify-center px-2',
            )}
            title={collapsed ? t('viewPublicProfile') : undefined}
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <span className="truncate text-xs">{t('viewPublicProfile')}</span>
            )}
          </Link>
        </div>
      )}

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
    </aside>
  );
}

// =============================================================================
// SidebarItem — extracted for clarity
// =============================================================================

function SidebarItem({
  item,
  pathname,
  collapsed,
  messageCount,
  notificationCount,
  t,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  messageCount: number;
  notificationCount: number;
  t: (key: string) => string;
}) {
  const Icon = item.icon;
  const isActive =
    pathname === item.href ||
    (item.href !== '/dashboard' && pathname.startsWith(item.href));

  let badgeCount = 0;
  if (item.href === '/dashboard/messages') badgeCount = messageCount;
  if (item.href === '/dashboard/notifications') badgeCount = notificationCount;

  return (
    <li>
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
}
