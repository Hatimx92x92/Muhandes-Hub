'use client';

import { type ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  key: string;
  label: string;
  count?: number;
  content: ReactNode;
}

interface PartnerProfileTabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

export function PartnerProfileTabs({ tabs, defaultTab }: PartnerProfileTabsProps) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.key);

  return (
    <div>
      {/* Tab triggers */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors',
              'hover:text-foreground focus-visible:outline-none',
              active === tab.key
                ? 'text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary'
                : 'text-muted-foreground',
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={cn(
                'ms-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium',
                active === tab.key
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground',
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="pt-6">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            className={active === tab.key ? 'block' : 'hidden'}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
