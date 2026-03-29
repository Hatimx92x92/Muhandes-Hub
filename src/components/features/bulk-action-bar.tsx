'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

// =============================================================================
// BulkActionBar — Sticky bar shown when rows are selected
// =============================================================================

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  onClick: (selectedIds: string[]) => void;
}

interface BulkActionBarProps {
  selectedCount: number;
  selectedIds: string[];
  actions: BulkAction[];
  onClear: () => void;
  className?: string;
}

export function BulkActionBar({
  selectedCount,
  selectedIds,
  actions,
  onClear,
  className,
}: BulkActionBarProps) {
  const t = useTranslations('common');
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        'sticky bottom-4 z-30 mx-auto flex w-fit items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 shadow-lg',
        className,
      )}
    >
      <span className="text-sm font-medium text-foreground">
        {t('selectedCount', { count: selectedCount })}
      </span>

      <div className="h-5 w-px bg-border" />

      {actions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant ?? 'secondary'}
          size="sm"
          onClick={() => action.onClick(selectedIds)}
        >
          {action.icon && <span className="me-1.5">{action.icon}</span>}
          {action.label}
        </Button>
      ))}

      <button
        type="button"
        onClick={onClear}
        className="ms-1 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={t('clearSelection')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
