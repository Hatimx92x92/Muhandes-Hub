import { getTranslations } from 'next-intl/server';
import { getAdminAuditLog, type AdminQueryParams } from '@/actions/admin/queries';
import { AuditLogTableClient } from './audit-log-table-client';

const AUDIT_ACTIONS = [
  'approve_post', 'reject_post', 'edit_post',
  'approve_documents', 'reject_documents',
  'ban_user', 'unban_user', 'restrict_user', 'unrestrict_user',
  'admin_edit_profile', 'admin_update_auth', 'generate_reset_link',
  'bulk_approve', 'bulk_ban', 'bulk_unban', 'bulk_restrict', 'bulk_unrestrict',
  'approve_commission_payment', 'resolve_commission_dispute',
  'update_setting', 'create_coupon', 'update_coupon', 'activate_coupon', 'deactivate_coupon',
  'update_announcement',
  'change_subscription', 'extend_subscription', 'cancel_subscription',
  'send_email', 'mark_contact_read', 'mark_contact_unread', 'delete_contact',
  'hide_review', 'unhide_review',
] as const;

const TARGET_TYPES = [
  'project', 'product', 'rfq', 'user', 'users', 'commission', 'review', 'coupon',
  'platform_settings', 'contact_submission',
] as const;

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const t = await getTranslations('admin');
  const params = await searchParams;

  const queryParams: AdminQueryParams = {
    page: Number(params.page) || 1,
    sort: params.sort,
    filters: {
      ...(params.action ? { action: params.action } : {}),
      ...(params.target_type ? { target_type: params.target_type } : {}),
    },
  };

  const result = await getAdminAuditLog(queryParams);

  // Build flat translations including audit action + target type labels
  const translations: Record<string, string> = {
    col_action: t('table.columns.action'),
    col_targetType: t('table.columns.targetType'),
    col_targetId: t('table.columns.targetId'),
    col_adminId: t('table.columns.adminId'),
    col_ip: t('table.columns.ip'),
    col_details: t('table.columns.details'),
    col_timestamp: t('table.columns.timestamp'),
    sort_newest: t('table.sort.newest'),
    sort_oldest: t('table.sort.oldest'),
    noAuditLogs: t('auditLogPage.noOperations'),
  };

  // Audit action translations
  for (const action of AUDIT_ACTIONS) {
    translations[`auditAction_${action}`] = t(`auditActions.${action}`);
  }

  // Target type translations
  for (const tt of TARGET_TYPES) {
    translations[`targetType_${tt}`] = t(`targetTypes.${tt}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('auditLogPage.title')}</h1>
        <p className="text-muted-foreground">
          {t('auditLogPage.subtitle')} ({result.totalCount} {t('auditLogPage.operationCount')})
        </p>
      </div>

      <AuditLogTableClient
        data={result.data}
        totalCount={result.totalCount}
        currentPage={result.page}
        totalPages={result.totalPages}
        translations={translations}
      />
    </div>
  );
}
