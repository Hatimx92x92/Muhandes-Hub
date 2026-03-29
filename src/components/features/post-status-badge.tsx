// =============================================================================
// Muhandes HUB — Post Status Badge (full workflow display)
// =============================================================================

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import {
  FileEdit,
  Clock,
  Globe,
  XCircle,
  Award,
  CheckCircle2,
  Timer,
  Ban,
} from 'lucide-react';

const STATUS_CONFIG = {
  draft: {
    key: 'draft',
    icon: FileEdit,
    className: 'bg-status-draft text-status-draft-foreground',
  },
  pending: {
    key: 'pending',
    icon: Clock,
    className: 'bg-status-pending text-status-pending-foreground',
  },
  published: {
    key: 'published',
    icon: Globe,
    className: 'bg-status-published text-status-published-foreground',
  },
  rejected: {
    key: 'rejected',
    icon: XCircle,
    className: 'bg-status-rejected text-status-rejected-foreground',
  },
  awarded: {
    key: 'awarded',
    icon: Award,
    className: 'bg-status-awarded text-status-awarded-foreground',
  },
  completed: {
    key: 'completed',
    icon: CheckCircle2,
    className: 'bg-status-completed text-status-completed-foreground',
  },
  expired: {
    key: 'expired',
    icon: Timer,
    className: 'bg-accent-orange text-accent-orange-foreground',
  },
  closed: {
    key: 'closed',
    icon: Ban,
    className: 'bg-status-draft text-status-draft-foreground',
  },
} as const;

export type PostStatusValue = keyof typeof STATUS_CONFIG;

interface PostStatusBadgeProps {
  status: PostStatusValue;
  className?: string;
  showIcon?: boolean;
}

export function PostStatusBadge({
  status,
  className,
  showIcon = true,
}: PostStatusBadgeProps) {
  const t = useTranslations('features.status');
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const Icon = config.icon;
  const label = t(config.key);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className,
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}
