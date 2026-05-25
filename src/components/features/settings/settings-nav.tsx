'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { User, Bell, AlertTriangle } from 'lucide-react';

const ICONS: Record<string, React.ElementType> = {
  '/dashboard/settings': User,
  '/dashboard/settings/notifications': Bell,
  '/dashboard/settings/account': AlertTriangle,
};

interface SettingsNavProps {
  tabs: { href: string; label: string }[];
}

export function SettingsNav({ tabs }: SettingsNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 lg:w-56 lg:shrink-0 lg:flex-col overflow-x-auto lg:overflow-visible">
      {tabs.map((tab) => {
        const Icon = ICONS[tab.href] ?? User;
        const isActive =
          tab.href === '/dashboard/settings'
            ? pathname === '/dashboard/settings' || pathname === '/dashboard/settings/'
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex items-center gap-3 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
