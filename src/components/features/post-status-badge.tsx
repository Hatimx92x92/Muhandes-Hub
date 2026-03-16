// =============================================================================
// Muqawil HUB — Post Status Badge (full workflow display)
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
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  pending: {
    key: 'pending',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  published: {
    key: 'published',
    icon: Globe,
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  rejected: {
    key: 'rejected',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  awarded: {
    key: 'awarded',
    icon: Award,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  completed: {
    key: 'completed',
    icon: CheckCircle2,
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  },
  expired: {
    key: 'expired',
    icon: Timer,
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  closed: {
    key: 'closed',
    icon: Ban,
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
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
