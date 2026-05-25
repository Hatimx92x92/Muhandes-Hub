'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/features/user-avatar';
import { formatRelativeTime } from '@/lib/utils';
import type { DashboardActivityItem } from '@/actions/analytics';
import {
  Activity,
  CheckCircle,
  XCircle,
  Plus,
  Bell,
  Handshake,
  Send,
  Upload,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

// =============================================================================
// Dashboard Activity Feed — Recent events timeline
// =============================================================================

const ACTION_ICONS: Record<string, React.ReactElement> = {
  deal_created: <Plus className="h-3.5 w-3.5 text-primary" />,
  deal_completed: <CheckCircle className="h-3.5 w-3.5 text-success" />,
  deal_cancelled: <XCircle className="h-3.5 w-3.5 text-destructive" />,
  deal_started: <Handshake className="h-3.5 w-3.5 text-primary" />,
  proof_submitted: <Send className="h-3.5 w-3.5 text-primary" />,
  proof_confirmed: <CheckCircle className="h-3.5 w-3.5 text-success" />,
  document_uploaded: <Upload className="h-3.5 w-3.5 text-primary" />,
  milestone_progress_updated: <TrendingUp className="h-3.5 w-3.5 text-info" />,
};

function getActionIcon(action: string, type: string): React.ReactElement {
  if (type === 'notification') {
    return <Bell className="h-3.5 w-3.5 text-primary" />;
  }
  return ACTION_ICONS[action] ?? <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
}

interface DashboardActivityFeedProps {
  activities: DashboardActivityItem[];
  locale: string;
}

export function DashboardActivityFeed({ activities, locale }: DashboardActivityFeedProps) {
  const t = useTranslations('features.dashboardActivity');

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-muted-foreground" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6 text-center">
          <Activity className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{t('noActivity')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-5 w-5 text-muted-foreground" />
          {t('title')}
        </CardTitle>
        <Link href="/dashboard/notifications">
          <Button variant="ghost" size="sm" className="text-xs">
            {t('viewAll')}
            <ArrowRight className="ms-1 h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-0 pb-2">
        {activities.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors"
          >
            {/* Timeline icon */}
            <div className="relative flex flex-col items-center pt-0.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card">
                {getActionIcon(item.action, item.type)}
              </div>
              {idx < activities.length - 1 && (
                <div className="absolute top-7 h-[calc(100%+0.25rem)] w-px bg-border" />
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex items-center gap-2">
                {item.actor_name && (
                  <UserAvatar src={item.actor_avatar} name={item.actor_name} size="xs" />
                )}
                <p className="truncate text-sm font-medium text-foreground">
                  {item.actor_name && <span className="font-semibold">{item.actor_name} </span>}
                  {item.title}
                </p>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {item.type === 'notification' ? t('notification') : t('deal')}
                </Badge>
              </div>
              {item.subtitle && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.subtitle}</p>
              )}
              <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                {formatRelativeTime(item.created_at, locale)}
              </p>
            </div>

            {/* Link arrow */}
            {item.href && (
              <Link href={item.href} className="shrink-0 pt-1">
                <ArrowRight className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              </Link>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
