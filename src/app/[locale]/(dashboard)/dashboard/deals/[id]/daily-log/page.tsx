// =============================================================================
// Daily Site Log Page — Server Component (per-deal)
// =============================================================================

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DailyLogForm } from '@/components/features/daily-log/daily-log-form';
import { getTranslations, getLocale } from 'next-intl/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any { return supabase; }

export default async function DailyLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: dealId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const t = await getTranslations('dashboard.deals');
  const locale = await getLocale();

  // Verify deal
  const { data: deal } = await db(supabase)
    .from('deals')
    .select('id, deal_type, status, buyer_id, seller_id')
    .eq('id', dealId)
    .single();

  if (!deal) notFound();

  // Must be a deal participant
  if (deal.buyer_id !== user.id && deal.seller_id !== user.id) {
    redirect('/dashboard/deals');
  }

  // Fetch logs
  const { data: logs } = await db(supabase)
    .from('daily_site_logs')
    .select('*')
    .eq('deal_id', dealId)
    .order('log_date', { ascending: false });

  // Check if today's log exists
  const today = new Date().toISOString().split('T')[0];
  const todayLog = (logs || []).find(
    (l: Record<string, unknown>) => (l.log_date as string) === today
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{t('dailyLogTitle')}</h1>
          <p className="text-sm text-muted-foreground">
            {(logs || []).length} {t('logRecords')}
          </p>
        </div>
        <Link
          href={`/dashboard/deals/${dealId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {t('backToDeal')}
        </Link>
      </div>

      {/* Today's Log Form */}
      {!todayLog && (
        <Card className="p-6">
          <h2 className="font-bold mb-4">{t('todayLog')} ({today})</h2>
          <DailyLogForm dealId={dealId} />
        </Card>
      )}

      {todayLog && (
        <Card className="p-4 bg-status-completed/10 border-status-completed/30">
          <p className="text-sm text-status-completed">✓ {t('todayLogRecorded')}</p>
        </Card>
      )}

      {/* Log Timeline */}
      {(logs && logs.length > 0) ? (
        <div className="space-y-4">
          {logs.map((log: Record<string, unknown>) => (
            <Card key={log.id as string} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">
                  {new Date(log.log_date as string).toLocaleDateString(locale, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                <div className="flex items-center gap-2">
                  {!!log.weather && (
                    <Badge variant="secondary">{log.weather as string}</Badge>
                  )}
                  {log.workers_on_site != null && (
                    <Badge variant="info">{log.workers_on_site as number} {t('workers')}</Badge>
                  )}
                </div>
              </div>

              {!!log.description_ar && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-0.5">{t('workCompleted')}</h4>
                  <p className="text-sm whitespace-pre-wrap">{log.description_ar as string}</p>
                </div>
              )}

              {!!log.description_en && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-0.5">Work Completed</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{log.description_en as string}</p>
                </div>
              )}

              {!!log.issues && (
                <div>
                  <h4 className="text-xs font-medium text-destructive mb-0.5">{t('issuesLabel')}</h4>
                  <p className="text-sm whitespace-pre-wrap">{log.issues as string}</p>
                </div>
              )}

              {!!log.safety_notes && (
                <div>
                  <h4 className="text-xs font-medium text-status-pending mb-0.5">{t('safetyNotes')}</h4>
                  <p className="text-sm whitespace-pre-wrap">{log.safety_notes as string}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">{t('noLogs')}</p>
        </Card>
      )}
    </div>
  );
}
