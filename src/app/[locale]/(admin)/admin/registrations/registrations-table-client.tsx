'use client';

import { useState, useMemo, useCallback, useTransition } from 'react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { AdminTableShell, type FilterGroup } from '@/components/features/admin/admin-table-shell';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/features/empty-state';
import { useRouter } from '@/i18n/navigation';
import { UserPlus, CheckCircle, XCircle, FileText, FileImage, Phone, Mail } from 'lucide-react';
import type { AdminRegistrationRow } from '@/actions/admin/queries';
import type { BulkAction } from '@/components/features/bulk-action-bar';
import { RegistrationDetailModal } from '@/components/features/admin/registration-detail-modal';
import { approveUserDocuments, rejectUserDocuments, bulkUserAction } from '@/actions/admin/users';
import { approveSubscriptionPayment, rejectSubscriptionPayment } from '@/actions/admin/subscriptions';
import { getProxyUrl } from '@/lib/file-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

// =============================================================================
// Registrations Table Client
// =============================================================================

const STATUS_VARIANTS: Record<string, BadgeProps['variant']> = {
  pending_email: 'info',
  pending_payment: 'pending',
  pending_documents: 'pending',
  pending_approval: 'warning',
};

interface RegistrationsTableClientProps {
  data: AdminRegistrationRow[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  translations: Record<string, string>;
}

export function RegistrationsTableClient({
  data,
  totalCount,
  currentPage,
  totalPages,
  translations: t,
}: RegistrationsTableClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [rejectDialog, setRejectDialog] = useState<{ userId: string } | null>(null);
  const [rejectReasonAr, setRejectReasonAr] = useState('');
  const [rejectReasonEn, setRejectReasonEn] = useState('');
  const [paymentRejectDialog, setPaymentRejectDialog] = useState<{ subscriptionId: string } | null>(null);
  const [paymentRejectReason, setPaymentRejectReason] = useState('');

  const handleApprove = useCallback(
    (userId: string) => {
      startTransition(async () => {
        await approveUserDocuments(userId);
        router.refresh();
      });
    },
    [router],
  );

  const handleRejectSubmit = useCallback(() => {
    if (!rejectDialog) return;
    startTransition(async () => {
      await rejectUserDocuments(rejectDialog.userId, rejectReasonAr, rejectReasonEn);
      setRejectDialog(null);
      setRejectReasonAr('');
      setRejectReasonEn('');
      router.refresh();
    });
  }, [rejectDialog, rejectReasonAr, rejectReasonEn, router]);

  const handleApprovePayment = useCallback(
    (subscriptionId: string) => {
      if (!confirm(t['approvePaymentConfirm'])) return;
      startTransition(async () => {
        await approveSubscriptionPayment(subscriptionId);
        router.refresh();
      });
    },
    [router, t],
  );

  const handleRejectPaymentSubmit = useCallback(() => {
    if (!paymentRejectDialog) return;
    startTransition(async () => {
      await rejectSubscriptionPayment(paymentRejectDialog.subscriptionId, paymentRejectReason);
      setPaymentRejectDialog(null);
      setPaymentRejectReason('');
      router.refresh();
    });
  }, [paymentRejectDialog, paymentRejectReason, router]);

  const columns: ColumnDef<AdminRegistrationRow>[] = useMemo(
    () => [
      {
        id: 'name',
        header: t['col_name'],
        sortKey: 'full_name',
        cell: (row) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {row.full_name ?? '—'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.company_name_ar ?? row.company_name_en ?? ''}
            </p>
          </div>
        ),
      },
      {
        id: 'email',
        header: t['col_email'],
        hiddenOnMobile: true,
        cell: (row) => row.email ? (
          <span className="truncate text-xs text-foreground" dir="ltr">
            <Mail className="me-1 inline h-3 w-3 text-muted-foreground" />
            {row.email}
          </span>
        ) : <span className="text-xs text-muted-foreground">—</span>,
      },
      {
        id: 'phone',
        header: t['col_phone'],
        hiddenOnMobile: true,
        cell: (row) => row.phone ? (
          <span className="flex items-center gap-1 text-xs text-foreground" dir="ltr">
            <Phone className="h-3 w-3 text-muted-foreground" />
            {row.phone}
          </span>
        ) : <span className="text-xs text-muted-foreground">—</span>,
      },
      {
        id: 'role',
        header: t['col_role'],
        cell: (row) => (
          <Badge variant={row.role as BadgeProps['variant']}>
            {t[`role_${row.role}`] ?? row.role}
          </Badge>
        ),
      },
      {
        id: 'tier',
        header: t['col_tier'],
        hiddenOnMobile: true,
        cell: (row) => (
          <Badge variant="outline">
            {t[`tier_${row.subscription_tier}`] ?? row.subscription_tier}
          </Badge>
        ),
      },
      {
        id: 'payment',
        header: t['col_payment'],
        cell: (row) => (
          <div className="space-y-1">
            {row.payment_method ? (
              <>
                <Badge variant={row.payment_method === 'bank_transfer' ? 'info' : 'outline'} className="text-[10px]">
                  {t[`pm_${row.payment_method}`] ?? row.payment_method}
                </Badge>
                {row.payment_status && (
                  <Badge
                    variant={
                      row.payment_status === 'completed' ? 'success' :
                      row.payment_status === 'failed' ? 'destructive' : 'pending'
                    }
                    className="text-[10px] ms-1"
                  >
                    {t[`ps_${row.payment_status}`] ?? row.payment_status}
                  </Badge>
                )}
                {row.bank_receipt_url && (
                  <a
                    href={getProxyUrl(row.bank_receipt_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileImage className="h-3 w-3" />
                    {t['viewReceipt']}
                  </a>
                )}
                {row.final_price != null && row.final_price > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    {Number(row.final_price).toFixed(2)} {t['sar']}
                  </p>
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground">{t['pm_free']}</span>
            )}
          </div>
        ),
      },
      {
        id: 'crVat',
        header: t['col_crVat'],
        hiddenOnMobile: true,
        cell: (row) => (
          <div className="space-y-0.5 text-xs" dir="ltr">
            {row.cr_number ? <p>{t['cr_label']}: {row.cr_number}</p> : null}
            {row.vat_number ? <p>{t['vat_label']}: {row.vat_number}</p> : null}
            {!row.cr_number && !row.vat_number && <span className="text-muted-foreground">—</span>}
          </div>
        ),
      },
      {
        id: 'status',
        header: t['col_status'],
        sortKey: 'verification_status',
        cell: (row) => (
          <Badge variant={STATUS_VARIANTS[row.verification_status] ?? 'secondary'}>
            {t[`status_${row.verification_status}`] ?? row.verification_status}
          </Badge>
        ),
      },
      {
        id: 'documents',
        header: t['col_documents'],
        hiddenOnMobile: true,
        cell: (row) => {
          if (!row.documents.length) return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {row.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={getProxyUrl(doc.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FileText className="h-3 w-3" />
                  {t[`doc_${doc.document_type}`] ?? doc.document_type}
                </a>
              ))}
            </div>
          );
        },
      },
      {
        id: 'created',
        header: t['col_created'],
        sortKey: 'created_at',
        hiddenOnMobile: true,
        cell: (row) => (
          <span className="text-xs text-muted-foreground">
            {row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: t['col_actions'],
        cell: (row) => (
          <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
            <RegistrationDetailModal registration={row} translations={t} />
            {/* Approve/Reject payment for pending_payment users */}
            {row.verification_status === 'pending_payment' && row.subscription_id && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  loading={isPending}
                  onClick={() => handleApprovePayment(row.subscription_id!)}
                >
                  <CheckCircle className="me-1 h-3.5 w-3.5" />
                  {t['action_approvePayment']}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  loading={isPending}
                  onClick={() => setPaymentRejectDialog({ subscriptionId: row.subscription_id! })}
                >
                  <XCircle className="me-1 h-3.5 w-3.5" />
                  {t['action_rejectPayment']}
                </Button>
              </>
            )}
            {/* Approve/Reject documents for pending_approval users */}
            {row.verification_status === 'pending_approval' && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  loading={isPending}
                  onClick={() => handleApprove(row.id)}
                >
                  <CheckCircle className="me-1 h-3.5 w-3.5" />
                  {t['action_approve']}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  loading={isPending}
                  onClick={() => setRejectDialog({ userId: row.id })}
                >
                  <XCircle className="me-1 h-3.5 w-3.5" />
                  {t['action_reject']}
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    [t, isPending, handleApprove, handleApprovePayment],
  );

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'status',
        label: t['col_status'],
        options: [
          { value: 'pending_email', label: t['status_pending_email'] },
          { value: 'pending_payment', label: t['status_pending_payment'] },
          { value: 'pending_documents', label: t['status_pending_documents'] },
          { value: 'pending_approval', label: t['status_pending_approval'] },
        ],
      },
      {
        key: 'role',
        label: t['col_role'],
        options: [
          { value: 'project_owner', label: t['role_project_owner'] },
          { value: 'contractor', label: t['role_contractor'] },
          { value: 'supplier', label: t['role_supplier'] },
          { value: 'buyer', label: t['role_buyer'] },
        ],
      },
      {
        key: 'payment_method',
        label: t['col_payment'],
        options: [
          { value: 'card', label: t['pm_card'] },
          { value: 'bank_transfer', label: t['pm_bank_transfer'] },
        ],
      },
    ],
    [t],
  );

  const sortOptions = useMemo(
    () => [
      { value: 'created_at:desc', label: t['sort_newest'] },
      { value: 'created_at:asc', label: t['sort_oldest'] },
      { value: 'full_name:asc', label: t['sort_nameAsc'] },
      { value: 'full_name:desc', label: t['sort_nameDesc'] },
    ],
    [t],
  );

  const handleRowClick = useCallback(
    (row: AdminRegistrationRow) => {
      router.push(`/admin/users/${row.id}`);
    },
    [router],
  );

  const bulkActions: BulkAction[] = useMemo(
    () => [
      {
        id: 'approve',
        label: t['action_approve'],
        icon: <CheckCircle className="h-4 w-4" />,
        variant: 'default' as const,
        onClick: (ids: string[]) => {
          startTransition(async () => {
            await bulkUserAction(ids, 'approve');
            setSelectedIds([]);
            router.refresh();
          });
        },
      },
    ],
    [t, router],
  );

  return (
    <>
      <AdminTableShell
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        filterGroups={filterGroups}
        searchable
        searchPlaceholder={t['searchPlaceholder']}
        sortOptions={sortOptions}
        selectedIds={selectedIds}
        selectedCount={selectedIds.length}
        bulkActions={bulkActions}
        onSelectionClear={() => setSelectedIds([])}
      >
        <DataTable
          columns={columns}
          data={data}
          getRowId={(row) => row.id}
          onRowClick={handleRowClick}
          selectable
          onSelectionChange={setSelectedIds}
          stickyHeader
          maxHeight="600px"
          emptyState={
            <EmptyState
              icon={<UserPlus className="h-12 w-12" />}
              title={t['noRegistrations']}
              description={t['noRegistrationsDesc']}
            />
          }
        />
      </AdminTableShell>

      {/* Reject Dialog (Documents) */}
      <Dialog open={!!rejectDialog} onOpenChange={(open) => !open && setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t['rejectReason']}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t['rejectReasonAr']}</label>
              <Input
                value={rejectReasonAr}
                onChange={(e) => setRejectReasonAr(e.target.value)}
                dir="rtl"
                placeholder="سبب الرفض..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t['rejectReasonEn']}</label>
              <Input
                value={rejectReasonEn}
                onChange={(e) => setRejectReasonEn(e.target.value)}
                dir="ltr"
                placeholder="Rejection reason..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>
              {t['cancel']}
            </Button>
            <Button
              variant="destructive"
              loading={isPending}
              onClick={handleRejectSubmit}
              disabled={!rejectReasonAr.trim() && !rejectReasonEn.trim()}
            >
              {t['confirmReject']}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog (Payment) */}
      <Dialog open={!!paymentRejectDialog} onOpenChange={(open) => !open && setPaymentRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t['rejectPaymentReason']}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t['rejectPaymentReasonLabel']}</label>
              <Input
                value={paymentRejectReason}
                onChange={(e) => setPaymentRejectReason(e.target.value)}
                placeholder={t['rejectPaymentReasonPlaceholder']}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentRejectDialog(null)}>
              {t['cancel']}
            </Button>
            <Button
              variant="destructive"
              loading={isPending}
              onClick={handleRejectPaymentSubmit}
              disabled={!paymentRejectReason.trim()}
            >
              {t['confirmRejectPayment']}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
