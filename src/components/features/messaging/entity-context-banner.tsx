// =============================================================================
// Muhandes HUB — Entity Context Banner for Chat Thread
// Shows deal/project/product context above the chat input area
// =============================================================================

import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Handshake, FolderOpen, Package } from 'lucide-react';
import { cn, formatSAR } from '@/lib/utils';
import type { DealStatus } from '@/types/enums';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DealContext {
  type: 'deal';
  id: string;
  titleSlug: string;
  status: DealStatus;
  value: number;
}

interface ProjectContext {
  type: 'project';
  id: string;
  title: string;
}

interface ProductContext {
  type: 'product';
  id: string;
  title: string;
}

type EntityContext = DealContext | ProjectContext | ProductContext;

interface EntityContextBannerProps {
  entity: EntityContext;
  locale?: string;
}

// ---------------------------------------------------------------------------
// Deal status color mapping
// ---------------------------------------------------------------------------

const DEAL_STATUS_STYLES: Record<DealStatus, { label: string; labelAr: string; className: string }> = {
  active: { label: 'Active', labelAr: 'نشطة', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  in_progress: { label: 'In Progress', labelAr: 'قيد التنفيذ', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  completed: { label: 'Completed', labelAr: 'مكتملة', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
  cancelled: { label: 'Cancelled', labelAr: 'ملغاة', className: 'bg-muted text-muted-foreground border-border' },
  disputed: { label: 'Disputed', labelAr: 'متنازع عليها', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EntityContextBanner({ entity, locale = 'ar' }: EntityContextBannerProps) {
  const isAr = locale === 'ar';

  if (entity.type === 'deal') {
    const status = DEAL_STATUS_STYLES[entity.status];
    return (
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Handshake className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground truncate">
            {entity.titleSlug}
          </span>
          <Badge
            variant="outline"
            className={cn('shrink-0 text-[10px] font-medium border', status.className)}
          >
            {isAr ? status.labelAr : status.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-medium text-muted-foreground">
            {formatSAR(entity.value, locale)}
          </span>
          <Link
            href={`/dashboard/deals/${entity.id}`}
            className="text-xs text-primary hover:underline"
          >
            {isAr ? 'عرض الصفقة ←' : 'View Deal →'}
          </Link>
        </div>
      </div>
    );
  }

  if (entity.type === 'project') {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground truncate">{entity.title}</span>
        </div>
        <Link
          href={`/dashboard/projects/${entity.id}`}
          className="shrink-0 text-xs text-primary hover:underline"
        >
          {isAr ? 'عرض المشروع ←' : 'View Project →'}
        </Link>
      </div>
    );
  }

  if (entity.type === 'product') {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground truncate">{entity.title}</span>
        </div>
        <Link
          href={`/dashboard/products/${entity.id}`}
          className="shrink-0 text-xs text-primary hover:underline"
        >
          {isAr ? 'عرض المنتج ←' : 'View Product →'}
        </Link>
      </div>
    );
  }

  return null;
}
