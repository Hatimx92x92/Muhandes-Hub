import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Users, Shield, Ban, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/features/empty-state';
import { AdminUserActions } from '@/components/features/admin/user-actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: any): any {
  return supabase;
}

const STATUS_VARIANTS: Record<string, 'pending' | 'success' | 'destructive' | 'warning' | 'info'> = {
  pending_email: 'pending',
  pending_payment: 'pending',
  pending_documents: 'pending',
  pending_approval: 'warning',
  active: 'success',
  banned: 'destructive',
  restricted: 'warning',
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const t = await getTranslations('admin');
  const locale = await getLocale();
  const { status: filterStatus, search } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Build query
  let query = db(supabase)
    .from('profiles')
    .select('id, full_name, company_name_ar, company_name_en, role, verification_status, is_admin, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (filterStatus) {
    query = query.eq('verification_status', filterStatus);
  }

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,company_name_ar.ilike.%${search}%,company_name_en.ilike.%${search}%`);
  }

  const { data: users } = await query;
  const items = (users ?? []) as Record<string, unknown>[];

  const statuses = ['active', 'pending_approval', 'pending_documents', 'pending_payment', 'pending_email', 'banned', 'restricted'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('usersPage.title')}</h1>
          <p className="text-muted-foreground">{t('usersPage.subtitle')}</p>
        </div>
      </div>

      {/* Filter badges */}
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/users">
          <Badge variant={!filterStatus ? 'default' : 'outline'}>{t('all')}</Badge>
        </Link>
        {statuses.map((s) => (
          <Link key={s} href={`/admin/users?status=${s}`}>
            <Badge variant={filterStatus === s ? 'default' : 'outline'}>
              {t(`userStatus.${s}`)}
            </Badge>
          </Link>
        ))}
      </div>

      {/* User list */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title={t('usersPage.noUsers')}
          description={t('usersPage.noUsersDesc')}
        />
      ) : (
        <div className="space-y-3">
          {items.map((u) => (
            <Link key={u.id as string} href={`/admin/users/${u.id as string}`}>
              <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20 cursor-pointer">
                <CardContent className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">
                        {(u.full_name as string) ?? t('noName')}
                      </p>
                      {!!u.is_admin && (
                        <Badge variant="info">
                          <Shield className="me-1 h-3 w-3" />
                          {t('adminBadge')}
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {(u.company_name_ar as string) ?? (u.company_name_en as string) ?? ''}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant={(u.role as string) === 'project_owner' ? 'project_owner' : (u.role as string) === 'contractor' ? 'contractor' : (u.role as string) === 'supplier' ? 'supplier' : 'buyer'}>
                        {t(`roleLabels.${u.role as string}`)}
                      </Badge>
                      <Badge variant={STATUS_VARIANTS[u.verification_status as string] ?? 'secondary'}>
                        {t(`userStatus.${u.verification_status as string}`)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <time className="text-muted-foreground">
                      {new Date(u.created_at as string).toLocaleDateString(locale)}
                    </time>
                    <AdminUserActions
                      userId={u.id as string}
                      currentStatus={u.verification_status as string}
                      isAdmin={!!u.is_admin}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
