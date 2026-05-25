import type { BadgeProps } from '@/components/ui/badge';

// =============================================================================
// Unified Status → Badge Variant Map
// Single source of truth for all status-to-badge-variant mappings across the app.
// =============================================================================

type BadgeVariant = NonNullable<BadgeProps['variant']>;

const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  // Post / moderation statuses
  draft: 'draft',
  pending: 'pending',
  pending_approval: 'pending',
  pending_email: 'pending',
  pending_payment: 'pending',
  pending_documents: 'pending',
  published: 'published',
  rejected: 'rejected',

  // Bid statuses
  shortlisted: 'info',
  awarded: 'awarded',
  withdrawn: 'secondary',

  // Deal statuses
  active: 'active',
  in_progress: 'info',
  completed: 'completed',
  cancelled: 'cancelled',
  disputed: 'destructive',

  // Quotation statuses
  sent: 'info',
  viewed: 'secondary',
  accepted: 'success',
  expired: 'warning',

  // Commission statuses
  approved: 'success',
  paid: 'completed',
  overdue: 'destructive',

  // Contract statuses
  signed: 'success',
  partially_signed: 'warning',
  voided: 'destructive',

  // Inquiry statuses
  responded: 'success',
  closed: 'secondary',

  // Generic
  open: 'info',
};

/**
 * Returns the Badge variant for a given status string.
 * Falls back to 'secondary' for unknown statuses.
 */
export function getStatusVariant(status: string): BadgeVariant {
  return STATUS_VARIANT_MAP[status] ?? 'secondary';
}
