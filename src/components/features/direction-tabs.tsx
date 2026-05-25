'use client';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export interface DirectionTab {
  key: string;
  label: string;
  count: number;
  href: string;
}

interface DirectionTabsProps {
  tabs: DirectionTab[];
  activeTab: string;
}

export function DirectionTabs({ tabs, activeTab }: DirectionTabsProps) {
  return (
    <div className="flex gap-2 border-b border-border pb-1">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            'rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
            activeTab === tab.key
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label} ({tab.count})
        </Link>
      ))}
    </div>
  );
}
