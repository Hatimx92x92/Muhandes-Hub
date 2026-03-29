import { getTranslations } from 'next-intl/server';
import { getAdminUsers, type AdminQueryParams } from '@/actions/admin/queries';
import { UsersTableClient } from './users-table-client';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const t = await getTranslations('admin');
  const tf = await getTranslations('features.adminUser');
  const params = await searchParams;

  const queryParams: AdminQueryParams = {
    page: Number(params.page) || 1,
    search: params.search,
    sort: params.sort,
    filters: {
      ...(params.status ? { status: params.status } : {}),
      ...(params.role ? { role: params.role } : {}),
    },
  };

  const result = await getAdminUsers(queryParams);

  // Build flat translation map for client
  const translations: Record<string, string> = {
    col_name: t('table.columns.name'),
    col_company: t('table.columns.company'),
    col_role: t('table.columns.role'),
    col_status: t('table.columns.status'),
    col_created: t('table.columns.created'),
    col_actions: t('table.columns.actions'),
    sort_newest: t('table.sort.newest'),
    sort_oldest: t('table.sort.oldest'),
    sort_nameAsc: t('table.sort.nameAsc'),
    sort_nameDesc: t('table.sort.nameDesc'),
    status_pending_email: t('userStatus.pending_email'),
    status_pending_payment: t('userStatus.pending_payment'),
    status_pending_documents: t('userStatus.pending_documents'),
    status_pending_approval: t('userStatus.pending_approval'),
    status_active: t('userStatus.active'),
    status_banned: t('userStatus.banned'),
    status_restricted: t('userStatus.restricted'),
    role_project_owner: t('roleLabels.project_owner'),
    role_contractor: t('roleLabels.contractor'),
    role_supplier: t('roleLabels.supplier'),
    role_buyer: t('roleLabels.buyer'),
    adminBadge: t('adminBadge'),
    noUsers: t('usersPage.noUsers'),
    noUsersDesc: t('usersPage.noUsersDesc'),
    searchPlaceholder: t('usersPage.title'),
    action_approve: tf('approve'),
    action_restrict: tf('restrict'),
    action_ban: tf('ban'),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('usersPage.title')}</h1>
        <p className="text-muted-foreground">{t('usersPage.subtitle')}</p>
      </div>

      <UsersTableClient
        data={result.data}
        totalCount={result.totalCount}
        currentPage={result.page}
        totalPages={result.totalPages}
        translations={translations}
      />
    </div>
  );
}
