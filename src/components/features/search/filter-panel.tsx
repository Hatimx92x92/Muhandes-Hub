'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
}

interface FilterPanelProps {
  groups: FilterGroup[];
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
  className?: string;
}

export function FilterPanel({
  groups,
  activeFilters,
  onFilterChange,
  onClear,
  className,
}: FilterPanelProps) {
  const t = useTranslations('features.filterPanel');
  const hasActive = Object.values(activeFilters).some(Boolean);

  return (
    <div className={cn('space-y-4', className)}>
      {hasActive && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {t('filters')}
          </span>
          <Button variant="ghost" size="sm" onClick={onClear}>
            {t('clearAll')}
          </Button>
        </div>
      )}

      {groups.map((group) => (
        <div key={group.key}>
          <h4 className="mb-2 text-sm font-medium">{group.label}</h4>
          <div className="flex flex-wrap gap-2">
            {group.options.map((option) => {
              const isActive = activeFilters[group.key] === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    onFilterChange(
                      group.key,
                      isActive ? '' : option.value,
                    )
                  }
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
