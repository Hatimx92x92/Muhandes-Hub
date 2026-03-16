import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// Badge Variants — All using CSS variable design tokens
// =============================================================================

const badgeVariants = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-muted text-muted-foreground',
  outline: 'border border-border text-foreground bg-transparent',
  destructive: 'bg-destructive text-destructive-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  info: 'bg-info text-info-foreground',
  // Role badges — using design token variables
  project_owner: 'bg-role-po text-role-po-foreground',
  contractor: 'bg-role-contractor text-role-contractor-foreground',
  supplier: 'bg-role-supplier text-role-supplier-foreground',
  buyer: 'bg-role-buyer text-role-buyer-foreground',
  // Tier badges — using design token variables
  starter: 'bg-tier-starter text-tier-starter-foreground',
  pro: 'bg-tier-pro text-tier-pro-foreground',
  business: 'bg-tier-business text-tier-business-foreground',
  enterprise: 'bg-tier-enterprise text-tier-enterprise-foreground',
  // Status badges — using design token variables
  draft: 'bg-status-draft text-status-draft-foreground',
  pending: 'bg-status-pending text-status-pending-foreground',
  published: 'bg-status-published text-status-published-foreground',
  rejected: 'bg-status-rejected text-status-rejected-foreground',
  awarded: 'bg-status-awarded text-status-awarded-foreground',
  completed: 'bg-status-completed text-status-completed-foreground',
  active: 'bg-status-active text-status-active-foreground',
  cancelled: 'bg-status-cancelled text-status-cancelled-foreground',
} as const;

// =============================================================================
// Types
// =============================================================================

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
}

// =============================================================================
// Component
// =============================================================================

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        'transition-colors',
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
