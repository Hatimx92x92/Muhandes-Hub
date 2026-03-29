// =============================================================================
// TierGate — Reusable upgrade prompt for tier-locked features & limits
// =============================================================================
// Server-compatible (no hooks). Pass `isLocked` from tier check in page.
// Two variants: 'feature' (Lock icon) for boolean features,
//               'limit' (AlertTriangle) for numeric limit reached.
// Two modes: 'page' (full-page centered block) and 'inline' (compact card).

import type { ReactNode } from 'react';
import { Lock, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TierGateProps {
  /** Whether the feature/limit is locked */
  isLocked: boolean;
  /** Title shown when locked */
  title: string;
  /** Description shown when locked */
  description: string;
  /** Upgrade button label */
  upgradeLabel: string;
  /** 'feature' → Lock icon, 'limit' → AlertTriangle icon */
  variant?: 'feature' | 'limit';
  /** 'page' → full-page centered, 'inline' → compact card */
  mode?: 'page' | 'inline';
  /** Children to render when NOT locked (optional for standalone usage) */
  children?: ReactNode;
}

export function TierGate({
  isLocked,
  title,
  description,
  upgradeLabel,
  variant = 'feature',
  mode = 'page',
  children,
}: TierGateProps) {
  if (!isLocked) return <>{children}</>;

  const Icon = variant === 'limit' ? AlertTriangle : Lock;

  if (mode === 'page') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full',
            variant === 'limit'
              ? 'bg-status-pending/10'
              : 'bg-muted',
          )}
        >
          <Icon
            className={cn(
              'h-8 w-8',
              variant === 'limit'
                ? 'text-status-pending'
                : 'text-muted-foreground',
            )}
          />
        </div>
        <h2 className="mt-4 text-xl font-bold text-foreground">{title}</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
        <Link href="/dashboard/subscription" className="mt-6">
          <Button>
            <ArrowUpRight className="me-2 h-4 w-4" />
            {upgradeLabel}
          </Button>
        </Link>
      </div>
    );
  }

  // inline mode
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border p-6 text-center',
        variant === 'limit'
          ? 'border-status-pending/30 bg-status-pending/10'
          : 'border-border bg-muted/50',
      )}
    >
      <Icon
        className={cn(
          'h-10 w-10',
          variant === 'limit'
            ? 'text-status-pending'
            : 'text-muted-foreground',
        )}
      />
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Link href="/dashboard/subscription">
        <Button size="sm">
          <ArrowUpRight className="me-2 h-4 w-4" />
          {upgradeLabel}
        </Button>
      </Link>
    </div>
  );
}

// =============================================================================
// TierLimitIndicator — Shows "3 / 10" usage counter in headers
// =============================================================================

interface TierLimitIndicatorProps {
  current: number;
  max: number;
  label?: string;
}

export function TierLimitIndicator({ current, max, label }: TierLimitIndicatorProps) {
  const isUnlimited = max === Infinity || !isFinite(max);
  const atLimit = !isUnlimited && current >= max;

  return (
    <span
      className={cn(
        'text-sm',
        atLimit ? 'font-medium text-destructive' : 'text-muted-foreground',
      )}
    >
      {isUnlimited
        ? label
          ? `${current} ${label}`
          : `${current}`
        : `${current} / ${max}`}
    </span>
  );
}
