import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

const actionVariants: Record<string, string> = {
  approve_post: 'success',
  reject_post: 'destructive',
  approve_documents: 'success',
  reject_documents: 'destructive',
  ban_user: 'destructive',
  unban_user: 'success',
  restrict_user: 'warning',
  unrestrict_user: 'success',
  approve_commission_payment: 'success',
  resolve_commission_dispute: 'info',
  hide_review: 'warning',
  unhide_review: 'success',
};

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const t = await getTranslations('admin');
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  const { data: entries, count } = await db(supabase)
    .from('admin_audit_log')
    .select('id, admin_id, action, target_type, target_id, details, ip_address, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('auditLogPage.title')}</h1>
        <p className="text-muted-foreground">{t('auditLogPage.subtitle')} ({count ?? 0} {t('auditLogPage.operationCount')})</p>
      </div>

      {/* Entries */}
      {!entries || entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">{t('auditLogPage.noOperations')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {(entries as Record<string, unknown>[]).map((entry) => (
            <Card key={entry.id as string}>
              <CardContent className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={(actionVariants[entry.action as string] ?? 'secondary') as 'success' | 'destructive' | 'warning' | 'info' | 'secondary'}>
                        {t(`auditActions.${entry.action as string}`)}
                      </Badge>
                      <Badge variant="outline">
                        {t(`targetTypes.${entry.target_type as string}`)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('auditLogPage.target')} {(entry.target_id as string)?.slice(0, 8) ?? '—'}
                      {' · '}
                      {t('auditLogPage.adminLabel')} {(entry.admin_id as string)?.slice(0, 8) ?? '—'}
                      {!!entry.ip_address && (
                        <>
                          {' · '}
                          IP: {entry.ip_address as string}
                        </>
                      )}
                    </p>
                    {!!entry.details && Object.keys(entry.details as Record<string, unknown>).length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {JSON.stringify(entry.details).slice(0, 100)}
                      </p>
                    )}
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {new Date(entry.created_at as string).toLocaleString(locale)}
                  </time>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`/admin/audit-log?page=${page - 1}`}
              className="rounded-lg border border-border px-3 py-1 text-sm hover:bg-muted"
            >
              {t('auditLogPage.prev')}
            </a>
          )}
          <span className="text-sm text-muted-foreground">
            {t('auditLogPage.pageOf', { page, total: totalPages })}
          </span>
          {page < totalPages && (
            <a
              href={`/admin/audit-log?page=${page + 1}`}
              className="rounded-lg border border-border px-3 py-1 text-sm hover:bg-muted"
            >
              {t('auditLogPage.next')}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
