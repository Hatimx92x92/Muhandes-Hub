import { getTranslations } from 'next-intl/server';
import { getAdminRegistrations, getRegistrationStats, type AdminQueryParams } from '@/actions/admin/queries';
import { RegistrationsTableClient } from './registrations-table-client';
import { AdminStatValue } from '@/components/features/admin/admin-stat-value';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, FileCheck, CreditCard, AlertCircle, Mail } from 'lucide-react';

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const t = await getTranslations('admin');
  const tr = await getTranslations('admin.registrationsPage');
  const tf = await getTranslations('features.adminUser');
  const params = await searchParams;

  const queryParams: AdminQueryParams = {
    page: Number(params.page) || 1,
    search: params.search,
    sort: params.sort,
    filters: {
      ...(params.status ? { status: params.status } : {}),
      ...(params.role ? { role: params.role } : {}),
      ...(params.payment_method ? { payment_method: params.payment_method } : {}),
    },
  };

  const [result, stats] = await Promise.all([
    getAdminRegistrations(queryParams),
    getRegistrationStats(),
  ]);

  const translations: Record<string, string> = {
    col_name: t('table.columns.name'),
    col_company: t('table.columns.company'),
    col_role: t('table.columns.role'),
    col_status: t('table.columns.status'),
    col_tier: tr('colTier'),
    col_documents: tr('colDocuments'),
    col_created: t('table.columns.created'),
    col_actions: t('table.columns.actions'),
    col_email: tr('colEmail'),
    col_phone: tr('colPhone'),
    col_payment: tr('colPayment'),
    col_crVat: tr('colCrVat'),
    cr_label: tr('crLabel'),
    vat_label: tr('vatLabel'),
    pm_card: tr('pmCard'),
    pm_bank_transfer: tr('pmBankTransfer'),
    pm_free: tr('pmFree'),
    ps_pending: tr('psPending'),
    ps_completed: tr('psCompleted'),
    ps_failed: tr('psFailed'),
    viewReceipt: tr('viewReceipt'),
    sar: tr('sar'),
    approvePaymentConfirm: tr('approvePaymentConfirm'),
    rejectPaymentReason: tr('rejectPaymentReason'),
    rejectPaymentReasonLabel: tr('rejectPaymentReasonLabel'),
    rejectPaymentReasonPlaceholder: tr('rejectPaymentReasonPlaceholder'),
    confirmRejectPayment: tr('confirmRejectPayment'),
    sort_newest: t('table.sort.newest'),
    sort_oldest: t('table.sort.oldest'),
    sort_nameAsc: t('table.sort.nameAsc'),
    sort_nameDesc: t('table.sort.nameDesc'),
    status_pending_email: t('userStatus.pending_email'),
    status_pending_payment: t('userStatus.pending_payment'),
    status_pending_documents: t('userStatus.pending_documents'),
    status_pending_approval: t('userStatus.pending_approval'),
    role_project_owner: t('roleLabels.project_owner'),
    role_contractor: t('roleLabels.contractor'),
    role_supplier: t('roleLabels.supplier'),
    role_buyer: t('roleLabels.buyer'),
    tier_starter: t('subscriptionTier.starter'),
    tier_pro: t('subscriptionTier.pro'),
    tier_business: t('subscriptionTier.business'),
    tier_enterprise: t('subscriptionTier.enterprise'),
    noRegistrations: tr('noRegistrations'),
    noRegistrationsDesc: tr('noRegistrationsDesc'),
    searchPlaceholder: tr('title'),
    action_approve: tf('approve'),
    action_reject: tf('reject'),
    action_approvePayment: tr('actionApprovePayment'),
    action_rejectPayment: tr('actionRejectPayment'),
    doc_vat_certificate: tr('docVatCertificate'),
    doc_commercial_license: tr('docCommercialLicense'),
    doc_pending: tr('docPending'),
    doc_approved: tr('docApproved'),
    doc_rejected: tr('docRejected'),
    viewDocs: tr('viewDocs'),
    rejectReason: tr('rejectReason'),
    rejectReasonAr: tr('rejectReasonAr'),
    rejectReasonEn: tr('rejectReasonEn'),
    confirmReject: tr('confirmReject'),
    cancel: tr('cancel'),
  };

  const statCards = [
    { label: tr('totalPending'), value: stats.total, icon: AlertCircle, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
    { label: t('userStatus.pending_email'), value: stats.pendingEmail, icon: Mail, color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' },
    { label: t('userStatus.pending_payment'), value: stats.pendingPayment, icon: CreditCard, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: t('userStatus.pending_documents'), value: stats.pendingDocuments, icon: FileCheck, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    { label: t('userStatus.pending_approval'), value: stats.pendingApproval, icon: Clock, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{tr('title')}</h1>
        <p className="text-muted-foreground">{tr('subtitle')}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-extrabold"><AdminStatValue value={stat.value} /></p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <RegistrationsTableClient
        data={result.data}
        totalCount={result.totalCount}
        currentPage={result.page}
        totalPages={result.totalPages}
        translations={translations}
      />
    </div>
  );
}
