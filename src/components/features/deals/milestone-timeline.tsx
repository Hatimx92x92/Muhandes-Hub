// =============================================================================
// Milestone Timeline Visualization Component
// =============================================================================

import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn, formatSAR, formatDate, getLocaleField } from '@/lib/utils';
import { Calendar, Banknote, CheckCircle } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';

const milestoneStatusBadge: Record<string, BadgeProps['variant']> = {
  pending: 'secondary',
  in_progress: 'pending',
  completed: 'success',
  skipped: 'info',
};

interface MilestoneTimelineProps {
  milestones: Array<Record<string, unknown>>;
  className?: string;
}

export async function MilestoneTimeline({ milestones, className }: MilestoneTimelineProps) {
  const t = await getTranslations('features.milestoneTimeline');
  const locale = await getLocale();
  if (milestones.length === 0) return null;

  return (
    <div className={cn('relative', className)}>
      {/* Vertical connector line */}
      <div className="absolute start-5 top-0 h-full w-0.5 bg-border" />

      <div className="space-y-6">
        {milestones.map((m, idx) => {
          const status = m.status as string;
          const isCompleted = status === 'completed';
          const isInProgress = status === 'in_progress';

          return (
            <div key={m.id as string} className="relative flex gap-4">
              {/* Circle indicator */}
              <div
                className={cn(
                  'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold',
                  isCompleted
                    ? 'border-success bg-success text-success-foreground'
                    : isInProgress
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground',
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  idx + 1
                )}
              </div>

              {/* Content */}
              <Card className={cn('flex-1 p-4', isInProgress && 'border-primary')}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-sm">{getLocaleField(m, 'title', locale)}</h4>
                  </div>
                  <Badge variant={milestoneStatusBadge[status] ?? 'secondary'}>
                    {t(`status.${status}` as 'status.pending')}
                  </Badge>
                </div>

                {!!m.description_ar && (
                  <p className="mt-2 text-xs text-muted-foreground">{getLocaleField(m, 'description', locale)}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  {!!m.due_date && (
                    <span className={cn(
                      'flex items-center gap-1',
                      isDeadlineNear(m.due_date as string) && 'text-warning',
                      isDeadlinePassed(m.due_date as string) && !isCompleted && 'text-destructive',
                    )}>
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(m.due_date as string)}
                    </span>
                  )}
                  {!!m.payment_amount && Number(m.payment_amount) > 0 && (
                    <span className="flex items-center gap-1">
                      <Banknote className="h-3.5 w-3.5" />
                      {formatSAR(Number(m.payment_amount))}
                    </span>
                  )}
                </div>

                {/* Progress bar if in progress */}
                {(Number(m.progress) || 0) > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{t('progress')}</span>
                      <span className="font-medium">{Number(m.progress)}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Number(m.progress)}%` }}
                      />
                    </div>
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function isDeadlineNear(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= 7;
}

function isDeadlinePassed(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}
