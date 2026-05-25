import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  /** Primary CTA — Button or Link wrapping a Button */
  action?: React.ReactNode;
  /** Renders a back chevron link above the title row */
  backHref?: string;
  /** Status badge shown inline beside the title */
  badge?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  backHref,
  badge,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {badge}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
