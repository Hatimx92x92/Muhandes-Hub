'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  /** Controlled active tab */
  activeTab?: string;
  /** Callback when tab changes */
  onTabChange?: (tabId: string) => void;
  /** Default active tab (uncontrolled) */
  defaultTab?: string;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab: controlledActive,
  onTabChange,
  defaultTab,
  className,
}: TabsProps) {
  const [internalActive, setInternalActive] = useState(defaultTab || tabs[0]?.id);
  const activeTab = controlledActive ?? internalActive;

  const handleTabClick = (tabId: string) => {
    if (!controlledActive) setInternalActive(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div
      className={cn(
        'relative flex gap-1 overflow-x-auto border-b border-border',
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              'relative inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold',
              'transition-colors duration-200',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.icon}
            {tab.label}
            {/* Active indicator — animated underline */}
            {isActive && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary animate-scale-in" />
            )}
          </button>
        );
      })}
    </div>
  );
}
