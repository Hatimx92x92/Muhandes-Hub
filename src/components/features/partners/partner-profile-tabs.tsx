'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
  return (
    <Tabs defaultValue={defaultTab || tabs[0]?.key}>
      <TabsList variant="line">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key}>
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ms-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
                {tab.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.key} value={tab.key} className="pt-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
