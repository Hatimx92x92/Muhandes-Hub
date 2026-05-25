'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Banknote, User, Handshake, Calendar, FileImage, AlertTriangle } from 'lucide-react';
import { formatSAR } from '@/lib/utils';
import { LocaleDate } from '@/components/ui/locale-date';
import { getProxyUrl } from '@/lib/file-utils';
import { Link } from '@/i18n/navigation';
import type { AdminCommissionRow } from '@/actions/admin/queries';

const STATUS_BADGE: Record<string, 'pending' | 'info' | 'success' | 'destructive' | 'warning' | 'secondary'> = {
  pending: 'pending',
  approved: 'info',
  paid: 'success',
  disputed: 'destructive',
  overdue: 'warning',
};

interface CommissionDetailModalProps {
  commission: AdminCommissionRow;
  translations: Record<string, string>;
}

export function CommissionDetailModal({ commission: c, translations: t }: CommissionDetailModalProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            <Eye className="me-1 h-3.5 w-3.5" />
            {t['viewDetails']}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            {t['commissionDetail']} #{c.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status */}
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_BADGE[c.status] ?? 'secondary'} className="text-sm">
              {t[`commStatus_${c.status}`] ?? c.status}
            </Badge>
            {c.paid_at && (
              <span className="text-xs text-muted-foreground">
                {t['paidAt']}: <LocaleDate date={c.paid_at} />
              </span>
            )}
          </div>

          {/* Amount Breakdown */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h4 className="text-sm font-semibold">{t['amountBreakdown']}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">{t['col_amount']}</span>
              <span className="font-medium text-end">{formatSAR(Number(c.amount ?? 0))}</span>
              <span className="text-muted-foreground">{t['col_vat']} (15%)</span>
              <span className="font-medium text-end">{formatSAR(Number(c.vat_amount ?? 0))}</span>
              <span className="font-semibold border-t border-border pt-1">{t['col_total']}</span>
              <span className="font-bold text-end border-t border-border pt-1">{formatSAR(Number(c.total ?? 0))}</span>
            </div>
            {c.commission_rate != null && (
              <p className="text-xs text-muted-foreground mt-1">
                {t['commissionRate']}: {c.commission_rate}%
              </p>
            )}
          </div>

          {/* Payment Info */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h4 className="text-sm font-semibold">{t['paymentInfo']}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">{t['paymentMethod']}</span>
              <span className="text-end">
                {c.payment_method ? (t[`pm_${c.payment_method}`] ?? c.payment_method) : '—'}
              </span>
              <span className="text-muted-foreground">{t['col_dueDate']}</span>
              <span className="text-end">
                <LocaleDate date={c.due_date} />
              </span>
            </div>
            {c.bank_receipt_url && (
              <a
                href={getProxyUrl(c.bank_receipt_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
              >
                <FileImage className="h-4 w-4" />
                {t['viewReceipt']}
              </a>
            )}
          </div>

          {/* Dispute Reason */}
          {c.dispute_reason && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {t['disputeReason']}
              </div>
              <p className="text-sm">{c.dispute_reason}</p>
            </div>
          )}

          {/* Seller Info */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4" />
              {t['seller']}
            </h4>
            <div className="text-sm space-y-1">
              <p className="font-medium">{c.seller_name ?? '—'}</p>
              {c.seller_company && (
                <p className="text-muted-foreground">{c.seller_company}</p>
              )}
              {c.seller_email && (
                <p className="text-muted-foreground" dir="ltr">{c.seller_email}</p>
              )}
              <Link
                href={`/admin/users/${c.seller_id}` as '/admin/users/[id]'}
                className="text-xs text-primary hover:underline"
              >
                {t['viewProfile']} →
              </Link>
            </div>
          </div>

          {/* Deal Info */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <Handshake className="h-4 w-4" />
              {t['relatedDeal']}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">{t['dealType']}</span>
              <span className="text-end">{c.deal_type ? (t[`dt_${c.deal_type}`] ?? c.deal_type) : '—'}</span>
              <span className="text-muted-foreground">{t['dealValue']}</span>
              <span className="text-end">{c.deal_value != null ? formatSAR(c.deal_value) : '—'}</span>
              <span className="text-muted-foreground">{t['dealStatus']}</span>
              <span className="text-end">{c.deal_status ? (t[`ds_${c.deal_status}`] ?? c.deal_status) : '—'}</span>
            </div>
            <Link
              href={`/admin/deals/${c.deal_id}` as '/admin/deals/[id]'}
              className="text-xs text-primary hover:underline"
            >
              {t['viewDeal']} →
            </Link>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {t['col_created']}: <LocaleDate date={c.created_at} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
