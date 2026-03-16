// =============================================================================
// Activity Feed Component — Chronological deal event log
// =============================================================================

import { Card } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils';
import {
  Activity, CheckCircle, XCircle, Plus, Send, Ban, Edit, Flag,
  ShieldCheck, ListChecks,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';

const actionIcons: Record<string, React.ReactNode> = {
  deal_created: <Plus className="h-4 w-4 text-primary" />,
  deal_completed: <CheckCircle className="h-4 w-4 text-success" />,
  deal_cancelled: <Ban className="h-4 w-4 text-destructive" />,
  deal_flagged_admin: <Flag className="h-4 w-4 text-warning" />,
  milestone_created: <ListChecks className="h-4 w-4 text-primary" />,
  milestone_suggestion: <Edit className="h-4 w-4 text-info" />,
  milestone_suggestion_approved: <CheckCircle className="h-4 w-4 text-success" />,
  milestone_suggestion_rejected: <XCircle className="h-4 w-4 text-destructive" />,
  proof_submitted: <Send className="h-4 w-4 text-primary" />,
  proof_confirmed: <ShieldCheck className="h-4 w-4 text-success" />,
  proof_rejected: <XCircle className="h-4 w-4 text-destructive" />,
  cancellation_requested: <Ban className="h-4 w-4 text-warning" />,
  cancellation_rejected: <XCircle className="h-4 w-4 text-destructive" />,
  skip_milestone_requested: <Edit className="h-4 w-4 text-warning" />,
  skip_milestone_approved: <CheckCircle className="h-4 w-4 text-success" />,
};

interface ActivityFeedProps {
  activities: Array<Record<string, unknown>>;
}

export async function ActivityFeed({ activities }: ActivityFeedProps) {
  const t = await getTranslations('features.activityFeed');
  if (activities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">{t('noActivity')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity, idx) => {
        const action = activity.action as string;
        const details = (activity.details ?? {}) as Record<string, unknown>;

        return (
          <div
            key={activity.id as string}
            className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50"
          >
            {/* Icon + connector line */}
            <div className="relative flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border">
                {actionIcons[action] ?? <Activity className="h-4 w-4 text-muted-foreground" />}
              </div>
              {idx < activities.length - 1 && (
                <div className="absolute top-8 h-full w-px bg-border" />
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pb-3">
              <p className="text-sm font-medium text-foreground">
                {t.has(`actions.${action}`) ? t(`actions.${action}` as 'actions.deal_created') : action}
              </p>
              {/* Show relevant details */}
              {!!details.reason && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {details.reason as string}
                </p>
              )}
              {!!details.proof_type && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('proofType')}: {details.proof_type as string} · {t('proofPercentage')}: {details.percentage_claim as number}%
                </p>
              )}
              {details.new_progress !== undefined && details.new_progress !== null && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('newProgress')}: {details.new_progress as number}%
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {formatRelativeTime(activity.created_at as string)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
