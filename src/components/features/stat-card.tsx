import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { ArrowUpLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import * as React from 'react';

// Color variants drive both border and icon background automatically.
type StatCardColor = 'default' | 'green' | 'yellow' | 'red' | 'blue';

const colorBorder: Record<StatCardColor, string> = {
  default: 'border-border',
  green: 'border-status-completed/30',
  yellow: 'border-status-pending/30',
  red: 'border-destructive/30',
  blue: 'border-primary/30',
};

const colorIconBg: Record<StatCardColor, string> = {
  default: 'bg-muted text-foreground',
  green: 'bg-success/10 text-success',
  yellow: 'bg-warning/10 text-warning',
  red: 'bg-destructive/10 text-destructive',
  blue: 'bg-primary/10 text-primary',
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  /** Clickable link variant */
  href?: string;
  /** Controls border and icon background tint */
  color?: StatCardColor;
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  href,
  color = 'default',
  className,
}: StatCardProps) {
  const cardClass = cn('p-4 rounded-xl border bg-card', colorBorder[color], className);
  const iconClass = cn(
    'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
    href ? 'bg-primary/10 text-primary' : colorIconBg[color],
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          cardClass,
          'group block transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/50',
        )}
      >
        <div className="flex items-center justify-between">
          <div className={iconClass}>{icon}</div>
          <ArrowUpLeft className="h-5 w-5 text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        </div>
        <p className="mt-4 text-2xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </Link>
    );
  }

  return (
    <Card className={cardClass} tabIndex={-1}>
      <CardContent className="flex items-center gap-3 p-0">
        <div className={iconClass}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
