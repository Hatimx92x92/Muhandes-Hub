'use client';

import { useMemo, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Menu, ExternalLink } from 'lucide-react';
import { useRealtimeCounts } from '@/hooks';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { ROLE_GROUPS, DEFAULT_GROUPS, type NavItem } from '@/components/layout/sidebar';
import type { UserRole } from '@/types';

// =============================================================================
// DashboardMobileNav — hamburger drawer for dashboard (md:hidden)
// =============================================================================

interface DashboardMobileNavProps {
  userRole?: UserRole;
  profileSlug?: string | null;
}

export function DashboardMobileNav({ userRole, profileSlug }: DashboardMobileNavProps) {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const { notificationCount, messageCount } = useRealtimeCounts();

  // Build role-aware groups (same logic as Sidebar)
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

  const showPublicProfile =
    profileSlug && (userRole === 'contractor' || userRole === 'supplier');

  const getBadgeCount = useCallback(
    (item: NavItem) => {
      if (item.href === '/dashboard/messages') return messageCount;
      if (item.href === '/dashboard/notifications') return notificationCount;
      return 0;
    },
    [messageCount, notificationCount],
  );

  return (
    <Sheet>
      <SheetTrigger
        className="inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted transition-colors"
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>

      <SheetContent side="left" showCloseButton>
        <SheetHeader>
          <SheetTitle className="text-lg font-bold">{tc('appName')}</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-0.5 p-3 pt-0 overflow-y-auto flex-1">
          {groups.map((group) => (
            <div key={group.labelKey} className="mb-2">
              {/* Group label */}
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {t(group.labelKey)}
              </p>

              {/* Group items */}
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const badgeCount = getBadgeCount(item);

                  return (
                    <li key={item.href + item.labelKey}>
                      <SheetClose
                        render={<Link href={item.href} />}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground border-s-2 border-s-primary'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                        )}
                      >
                        <span className="relative shrink-0">
                          <Icon className="h-5 w-5" />
                          {badgeCount > 0 && (
                            <span className="absolute -top-1.5 -inset-e-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[8px] font-bold text-destructive-foreground">
                              {badgeCount > 9 ? '9+' : badgeCount}
                            </span>
                          )}
                        </span>
                        <span className="flex-1">{t(item.labelKey)}</span>
                        {badgeCount > 0 && (
                          <span className="ms-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold text-destructive-foreground">
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </span>
                        )}
                      </SheetClose>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Public profile link */}
          {showPublicProfile && (
            <>
              <hr className="my-1 border-border" />
              <SheetClose
                render={<Link href={`/partners/${profileSlug}`} />}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-5 w-5 shrink-0" />
                <span>{t('viewPublicProfile')}</span>
              </SheetClose>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
