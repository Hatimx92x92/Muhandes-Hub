'use client';

import { Link } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { ADMIN_GROUPS } from '@/components/layout/admin-sidebar';

// =============================================================================
// AdminMobileNav — hamburger drawer for admin panel (lg:hidden)
// =============================================================================

interface AdminMobileNavProps {
  adminName: string;
}

export function AdminMobileNav({ adminName }: AdminMobileNavProps) {
  const pathname = usePathname();
  const t = useTranslations('admin.nav');
  const tc = useTranslations('common');

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
          {ADMIN_GROUPS.map((group) => (
            <div key={group.labelKey} className="mb-2">
              {/* Group label */}
              <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {t(group.labelKey)}
              </p>

              {/* Group items */}
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/admin' && pathname.startsWith(item.href));

                  return (
                    <li key={item.href}>
                      <SheetClose
                        render={<Link href={item.href} />}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-primary/10 text-primary border-s-2 border-s-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{t(item.labelKey)}</span>
                      </SheetClose>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Admin name footer */}
        <div className="border-t border-border px-6 py-3">
          <p className="truncate text-sm font-medium">{adminName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('adminPanel')}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
